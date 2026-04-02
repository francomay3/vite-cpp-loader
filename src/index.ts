import type { Plugin, ResolvedConfig } from 'vite';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { CppLoaderOptions } from './types';
import { compile, type ResolvedOptions } from './compiler';
import { extractFunctions } from './parser';
import { generateDeclarations } from './declarations';
import { generateModule } from './moduleTemplate';
import { generateCppProperties } from './vscode';

const DEFAULT_CACHE_DIR = 'node_modules/.cpp-wasm';
const DEFAULT_OPT_LEVEL = 'O2' as const;

export default function cppLoader(options: CppLoaderOptions = {}): Plugin {
  let isServe = false;
  let projectRoot = process.cwd();
  const setupVSCode = options.setupVSCode !== false;

  const resolvedOptions: ResolvedOptions = {
    emccArgs: options.emccArgs ?? [],
    cacheDir: path.resolve(options.cacheDir ?? DEFAULT_CACHE_DIR),
    optimizationLevel: options.optimizationLevel ?? DEFAULT_OPT_LEVEL,
    setupVSCode,
  };

  return {
    name: 'vite-cpp-loader',

    configResolved(config: ResolvedConfig) {
      isServe = config.command === 'serve';
      projectRoot = config.root;
    },

    buildStart() {
      if (setupVSCode) generateCppProperties(projectRoot).catch(() => {});
    },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.endsWith('.wasm')) {
          const wasmPath = path.join(resolvedOptions.cacheDir, path.basename(req.url));
          res.setHeader('Content-Type', 'application/wasm');
          fs.readFile(wasmPath)
            .then(content => res.end(content))
            .catch(() => next());
        } else {
          next();
        }
      });
    },

    async load(id) {
      if (!id.endsWith('.cpp')) return;

      const result = await compile(id, resolvedOptions, isServe);
      const functions = await extractFunctions(id, result.tsdPath);

      const dtsPath = path.join(path.dirname(id), path.basename(id) + '.d.ts');
      await fs.writeFile(dtsPath, generateDeclarations(functions));

      this.addWatchFile(result.jsPath);

      return generateModule(result.jsPath, functions);
    },
  };
}
