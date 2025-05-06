import type { Plugin } from 'vite';
import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import extractFunctionDeclarations from './extractFunctionDeclarations';
import type { CppFunction } from './types';
import cppToTsType from './cppToTsType';
import { generateTypeScriptDeclarations } from './generateTypeScriptDeclarations';


export default function cppLoader(): Plugin {
  return {
    name: 'vite-cpp-loader',
    configureServer(server) {
      // Serve WASM files from the filesystem in development mode
      server.middlewares.use((req, res, next) => {
        if (req.url?.endsWith('.wasm')) {
          const wasmPath = path.join(process.cwd(), 'node_modules', '.cpp-wasm', path.basename(req.url));
          res.setHeader('Content-Type', 'application/wasm');
          fs.readFile(wasmPath)
            .then(content => {
              res.end(content);
            })
            .catch(() => {
              next();
            });
        } else {
          next();
        }
      });
    },
    async load(id) {
      if (!id.endsWith('.cpp')) return;

      // Read the C++ file to extract function declarations
      const cppCode = await fs.readFile(id, 'utf-8');
      const functions = extractFunctionDeclarations(cppCode);

      // Create output directory if it doesn't exist
      const outputDir = path.join(process.cwd(), 'node_modules', '.cpp-wasm');
      await fs.mkdir(outputDir, { recursive: true });

      const baseName = path.basename(id, '.cpp');
      const jsOut = path.join(outputDir, baseName + '.js');
      const wasmOut = path.join(outputDir, baseName + '.wasm');
      const dtsOut = path.join(path.dirname(id), baseName + '.cpp.d.ts');

      // Generate and write TypeScript declarations
      const declarations = generateTypeScriptDeclarations(functions);
      await fs.writeFile(dtsOut, declarations);

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

      // In serve mode, we serve the WASM file directly from the filesystem
      const isServeMode = process.env.NODE_ENV === 'development';
      if (!isServeMode) {
        // Only emit files in build mode
        const wasmSource = await fs.readFile(wasmOut);
        this.emitFile({
          type: 'asset',
          fileName: path.basename(wasmOut),
          source: wasmSource
        });
      }

      // Return re-export stub with function information
      return `
        import factory from '${jsOut}';
        
        let mod = null;
        let initError = null;
        let initPromise = null;
        let isInitialized = false;

        const waitForInit = async () => {
          if (isInitialized) return mod;
          if (initError) throw initError;
          if (!initPromise) {
            initPromise = factory().then(m => {
              mod = m;
              isInitialized = true;
              return m;
            }).catch(err => {
              initError = err;
              throw err;
            });
          }
          return initPromise;
        };

        // Start initialization immediately
        waitForInit();

        const init = async () => {
          return waitForInit();
        };

        // Create a proxy to handle both sync and async access
        const createFunction = (name) => {
          return function(...args) {
            if (isInitialized) {
              return mod[name](...args);
            }
            return waitForInit().then(m => m[name](...args));
          };
        };

        // Export functions that can be used both sync and async
        ${functions.map(func => `export const ${func.name} = createFunction('${func.name}');`).join('\n')}

        export default {
          init,
          ${functions.map(func => func.name).join(',\n          ')}
        };
      `;
    }
  };
} 