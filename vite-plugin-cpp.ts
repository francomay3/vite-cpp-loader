import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Plugin } from 'vite';

// Function to extract function declarations from C++ code
function extractFunctionDeclarations(cppCode: string): string[] {
  // This regex matches function declarations like:
  // - emscripten::function("functionName", &functionName)
  const bindRegex = /emscripten::function\s*\(\s*"(.*?)"\s*,\s*&(\w+)\s*\)/g;
  const functions: string[] = [];
  let match;

  while ((match = bindRegex.exec(cppCode)) !== null) {
    functions.push(match[1]); // use the exposed name
  }

  return functions;
}

export default function cppWasm(): Plugin {
  return {
    name: 'vite-plugin-cpp-wasm',
    async load(id) {
      if (!id.endsWith('.cpp')) return;

      // Read the C++ file to extract function declarations
      const cppCode = await fs.readFile(id, 'utf-8');
      const functions = extractFunctionDeclarations(cppCode);

      console.log('Found C++ functions:', functions);

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

      const exports = functions.map(functionName => `export const ${functionName} = mod.${functionName};`).join('\n');  

      // Return re-export stub with function information
      return `
        import factory from './${path.basename(jsOut)}';
        const mod = await factory();
        ${exports}
        export default mod;
      `;
    }
  };
}
