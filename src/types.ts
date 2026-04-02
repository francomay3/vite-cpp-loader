export interface CppFunction {
  name: string;
  returnType: string; // TypeScript type string (already mapped from C++)
  parameters: Array<{ type: string; name: string }>; // TypeScript type strings
}

export interface CppLoaderOptions {
  emccArgs?: string[];
  cacheDir?: string;
  optimizationLevel?: 'O0' | 'O1' | 'O2' | 'O3' | 'Os' | 'Oz';
  /** Auto-generate .vscode/c_cpp_properties.json with Emscripten include paths. Default: true */
  setupVSCode?: boolean;
}

export interface CompileResult {
  jsPath: string;
  tsdPath: string;
}

export type CacheManifest = Record<string, {
  hash: string;
  jsPath: string;
  tsdPath: string;
}>;
