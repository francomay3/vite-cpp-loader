import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { CacheManifest } from './types.js';

let manifestWriteChain = Promise.resolve();

export async function readManifest(
  cacheDir: string,
  readFile: (p: string) => Promise<Buffer | string>
): Promise<CacheManifest> {
  try {
    const raw = await readFile(path.join(cacheDir, 'manifest.json'));
    return JSON.parse(raw.toString()) as CacheManifest;
  } catch {
    return {};
  }
}

export function scheduleManifestWrite(
  cacheDir: string,
  manifest: CacheManifest,
  writeFile: (p: string, data: string) => Promise<void>
): void {
  manifestWriteChain = manifestWriteChain.then(() =>
    writeFile(path.join(cacheDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
  );
}

export async function isCacheValid(
  entry: CacheManifest[string] | undefined,
  hash: string,
  stat: (p: string) => Promise<unknown>
): Promise<boolean> {
  if (!entry || entry.hash !== hash) return false;
  try {
    await stat(entry.jsPath);
    return true;
  } catch {
    return false;
  }
}
