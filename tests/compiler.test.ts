import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { CompilerDeps, ResolvedOptions, SpawnResult } from '../src/compiler.js';

// Import compile after vi.mock calls are hoisted — use dynamic import inside tests
// to get a fresh module per describe block is complex with ESM; instead we directly
// use the dependency-injection interface that compile() accepts.

const defaultOptions: ResolvedOptions = {
  emccArgs: [],
  cacheDir: '/fake/cache',
  optimizationLevel: 'O2',
  setupVSCode: false,
};

const CPP_CONTENT = '#include <emscripten/bind.h>\nint add(int a, int b){return a+b;}\nEMSCRIPTEN_BINDINGS(m){emscripten::function("add",&add);}';
const HASH_MATCH = '1234567890abcdef'; // we'll compute this properly in tests via the actual hash

function makeSpawn(code = 0, stderr = ''): CompilerDeps['spawnFn'] {
  return vi.fn().mockResolvedValue({ code, stderr } satisfies SpawnResult);
}

function makeFs(manifestContent?: string, jsExists = true): Partial<CompilerDeps> {
  return {
    readFile: vi.fn().mockImplementation((p: string) => {
      if (p.endsWith('manifest.json')) {
        if (manifestContent) return Promise.resolve(manifestContent);
        return Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }));
      }
      if (p.endsWith('.cpp')) return Promise.resolve(CPP_CONTENT);
      return Promise.resolve('');
    }),
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
    stat: vi.fn().mockImplementation(() =>
      jsExists ? Promise.resolve({}) : Promise.reject(Object.assign(new Error('ENOENT'), { code: 'ENOENT' }))
    ),
  };
}

describe('compile() — cache behavior', () => {
  let compile: typeof import('../src/compiler.js').compile;

  beforeEach(async () => {
    // Re-import to reset module-level in-flight map between tests
    vi.resetModules();
    const mod = await import('../src/compiler.js');
    compile = mod.compile;
  });

  it('skips em++ on cache hit (matching hash, js file exists)', async () => {
    // Pre-compute hash of CPP_CONTENT to build a matching manifest
    const { createHash } = await import('node:crypto');
    const hash = createHash('sha256').update(CPP_CONTENT, 'utf8').digest('hex').slice(0, 16);

    const manifest = JSON.stringify({
      '/fake/src/math.cpp': { hash, jsPath: '/fake/cache/math.js', tsdPath: '/fake/cache/math.tsd.d.ts' },
    });

    const spawnFn = makeSpawn();
    const deps = { ...makeFs(manifest), spawnFn };

    const result = await compile('/fake/src/math.cpp', defaultOptions, true, deps);

    expect(spawnFn).not.toHaveBeenCalled();
    expect(result.jsPath).toBe('/fake/cache/math.js');
  });

  it('calls em++ on cache miss (hash changed)', async () => {
    const manifest = JSON.stringify({
      '/fake/src/math.cpp': { hash: 'stale_hash_000000', jsPath: '/fake/cache/math.js', tsdPath: '/fake/cache/math.tsd.d.ts' },
    });

    const spawnFn = makeSpawn();
    const deps = { ...makeFs(manifest), spawnFn };

    await compile('/fake/src/math.cpp', defaultOptions, true, deps);

    expect(spawnFn).toHaveBeenCalledOnce();
  });

  it('calls em++ when no manifest exists', async () => {
    const spawnFn = makeSpawn();
    const deps = { ...makeFs(undefined), spawnFn }; // no manifest

    await compile('/fake/src/math.cpp', defaultOptions, true, deps);

    expect(spawnFn).toHaveBeenCalledOnce();
  });

  it('writes manifest after successful compile', async () => {
    const writeFile = vi.fn().mockResolvedValue(undefined);
    const deps = { ...makeFs(undefined), writeFile, spawnFn: makeSpawn() };

    await compile('/fake/src/math.cpp', defaultOptions, true, deps);

    // Wait for the manifest write chain
    await new Promise(r => setTimeout(r, 10));

    expect(writeFile).toHaveBeenCalledWith(
      expect.stringContaining('manifest.json'),
      expect.stringContaining('math.js')
    );
  });

  it('throws on non-zero em++ exit code', async () => {
    const spawnFn = makeSpawn(1, 'compilation error: syntax error');
    const deps = { ...makeFs(undefined), spawnFn };

    await expect(compile('/fake/src/math.cpp', defaultOptions, true, deps))
      .rejects.toThrow('em++ failed to compile');
  });

  it('does NOT include -sSINGLE_FILE in dev (serve) mode', async () => {
    const spawnFn = makeSpawn();
    const deps = { ...makeFs(undefined), spawnFn };

    await compile('/fake/src/math.cpp', defaultOptions, true /* isServe */, deps);

    const args: string[] = (spawnFn as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(args).not.toContain('-sSINGLE_FILE');
  });

  it('includes -sSINGLE_FILE in build mode', async () => {
    const spawnFn = makeSpawn();
    const deps = { ...makeFs(undefined), spawnFn };

    await compile('/fake/src/math.cpp', defaultOptions, false /* isServe */, deps);

    const args: string[] = (spawnFn as ReturnType<typeof vi.fn>).mock.calls[0][1];
    expect(args).toContain('-sSINGLE_FILE');
  });

  it('appends custom emccArgs after base args', async () => {
    const spawnFn = makeSpawn();
    const deps = { ...makeFs(undefined), spawnFn };
    const options = { ...defaultOptions, emccArgs: ['--custom-flag', '-sASSERTIONS=1'] };

    await compile('/fake/src/math.cpp', options, true, deps);

    const args: string[] = (spawnFn as ReturnType<typeof vi.fn>).mock.calls[0][1];
    const last2 = args.slice(-2);
    expect(last2).toEqual(['--custom-flag', '-sASSERTIONS=1']);
  });

  it('calls em++ on cache hit where js file is missing from disk', async () => {
    const { createHash } = await import('node:crypto');
    const hash = createHash('sha256').update(CPP_CONTENT, 'utf8').digest('hex').slice(0, 16);
    const manifest = JSON.stringify({
      '/fake/src/math.cpp': { hash, jsPath: '/fake/cache/math.js', tsdPath: '/fake/cache/math.tsd.d.ts' },
    });

    const spawnFn = makeSpawn();
    const deps = { ...makeFs(manifest, false /* jsExists = false */), spawnFn };

    await compile('/fake/src/math.cpp', defaultOptions, true, deps);

    expect(spawnFn).toHaveBeenCalledOnce();
  });
});
