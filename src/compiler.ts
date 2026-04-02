import { spawn, type SpawnOptions } from 'node:child_process';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { CompileResult, CppLoaderOptions } from './types.js';
import { readManifest, scheduleManifestWrite, isCacheValid } from './manifest.js';
import { extractTopLevelFunctionNames, buildAutoBindings } from './parser.js';

export interface ResolvedOptions extends Required<CppLoaderOptions> {
  cacheDir: string;
}

export interface SpawnResult {
  code: number;
  stderr: string;
}

type SpawnFn = (cmd: string, args: string[], opts?: SpawnOptions) => Promise<SpawnResult>;
type FsReadFile = (p: string) => Promise<Buffer | string>;
type FsWriteFile = (p: string, data: string) => Promise<void>;
type FsMkdir = (p: string, opts?: { recursive?: boolean }) => Promise<unknown>;
type FsStat = (p: string) => Promise<unknown>;

export interface CompilerDeps {
  spawnFn?: SpawnFn;
  readFile?: FsReadFile;
  writeFile?: FsWriteFile;
  mkdir?: FsMkdir;
  stat?: FsStat;
}

const inFlight = new Map<string, Promise<CompileResult>>();

export function defaultSpawn(cmd: string, args: string[], opts?: SpawnOptions): Promise<SpawnResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'inherit', 'pipe'], ...opts });
    const stderrChunks: Buffer[] = [];

    child.stderr?.on('data', (chunk: Buffer) => {
      stderrChunks.push(chunk);
      process.stderr.write(chunk);
    });

    child.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'ENOENT') {
        reject(new Error('em++ not found. Ensure Emscripten is installed and in your PATH.'));
      } else {
        reject(err);
      }
    });

    child.on('close', code => {
      resolve({ code: code ?? 1, stderr: Buffer.concat(stderrChunks).toString() });
    });
  });
}

function hashContent(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex').slice(0, 16);
}

async function prepareTempFile(
  id: string,
  content: string,
  options: ResolvedOptions,
  deps: Required<CompilerDeps>
): Promise<{ compileId: string; cleanup: () => Promise<void> }> {
  if (content.includes('EMSCRIPTEN_BINDINGS')) {
    return { compileId: id, cleanup: async () => {} };
  }
  const names = extractTopLevelFunctionNames(content);
  const tmpPath = path.join(options.cacheDir, path.basename(id, '.cpp') + '__tmp.cpp');
  await deps.writeFile(tmpPath, content + buildAutoBindings(names));
  return { compileId: tmpPath, cleanup: () => fs.unlink(tmpPath).catch(() => {}) };
}

async function doCompile(
  id: string,
  options: ResolvedOptions,
  isServe: boolean,
  deps: Required<CompilerDeps>
): Promise<CompileResult> {
  const content = (await deps.readFile(id)).toString();
  const hash = hashContent(content);

  await deps.mkdir(options.cacheDir, { recursive: true });

  const manifest = await readManifest(options.cacheDir, deps.readFile);
  const cached = manifest[id];

  if (await isCacheValid(cached, hash, deps.stat)) {
    return { jsPath: cached.jsPath, tsdPath: cached.tsdPath };
  }

  const baseName = path.basename(id, '.cpp');
  const jsPath = path.join(options.cacheDir, baseName + '.js');
  const tsdPath = path.join(options.cacheDir, baseName + '.tsd.d.ts');

  const { compileId, cleanup } = await prepareTempFile(id, content, options, deps);

  const args = [
    compileId,
    '-o', jsPath,
    `-${options.optimizationLevel}`,
    '-sEXPORT_ES6',
    '-sMODULARIZE',
    '-sENVIRONMENT=web',
    '-sALLOW_MEMORY_GROWTH',
    '-lembind',
    '--emit-tsd', tsdPath,
    ...(isServe ? [] : ['-sSINGLE_FILE']),
    ...options.emccArgs,
  ];

  const result = await deps.spawnFn('em++', args);
  await cleanup();

  if (result.code !== 0) {
    throw new Error(`em++ failed to compile ${path.basename(id)}:\n${result.stderr}`);
  }

  manifest[id] = { hash, jsPath, tsdPath };
  scheduleManifestWrite(options.cacheDir, manifest, deps.writeFile);

  return { jsPath, tsdPath };
}

export function compile(
  id: string,
  options: ResolvedOptions,
  isServe: boolean,
  overrides: CompilerDeps = {}
): Promise<CompileResult> {
  const existing = inFlight.get(id);
  if (existing) return existing;

  const deps: Required<CompilerDeps> = {
    spawnFn: overrides.spawnFn ?? defaultSpawn,
    readFile: overrides.readFile ?? ((p) => fs.readFile(p)),
    writeFile: overrides.writeFile ?? ((p, d) => fs.writeFile(p, d)),
    mkdir: overrides.mkdir ?? ((p, o) => fs.mkdir(p as string, o)),
    stat: overrides.stat ?? ((p) => fs.stat(p as string)),
  };

  const promise = doCompile(id, options, isServe, deps).finally(() => {
    inFlight.delete(id);
  });

  inFlight.set(id, promise);
  return promise;
}
