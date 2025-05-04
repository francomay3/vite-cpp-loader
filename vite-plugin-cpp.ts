import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Plugin } from 'vite';

export default function cppWasm(): Plugin {
  return {
    name: 'vite-plugin-cpp-wasm',
    async load(id) {
      if (!id.endsWith('.cpp')) return;

      const jsOut = id + '.js';
      const wasmOut = id + '.wasm';

      // Compile the .cpp file using em++
      const result = spawnSync('em++', [
        id,
        '-o', jsOut,
        '-O2',
        '-sEXPORT_ES6',
        '-sMODULARIZE',
        '-sENVIRONMENT=web',
        '-sALLOW_MEMORY_GROWTH',
        '-lembind'
      ], { stdio: 'inherit' });

      if (result.status !== 0) {
        throw new Error(`em++ failed to compile ${id}`);
      }

      // Emit the .wasm file so Vite can serve it
      const wasmSource = await fs.readFile(wasmOut);
      this.emitFile({
        type: 'asset',
        fileName: path.basename(wasmOut),
        source: wasmSource
      });

      // Return re-export stub
      return `export { default } from './${path.basename(jsOut)}';`;
    }
  };
}
