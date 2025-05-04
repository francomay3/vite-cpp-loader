import { spawnSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Plugin } from 'vite';

interface CppFunction {
  name: string;
  returnType: string;
  parameters: Array<{ type: string; name: string }>;
}

// Function to extract function declarations from C++ code
function extractFunctionDeclarations(cppCode: string): CppFunction[] {
  // First, find the function definitions
  const functionRegex = /(\w+(?:\s*<.*?>)?)\s+(\w+)\s*\((.*?)\)\s*{/g;
  const bindRegex = /emscripten::function\s*\(\s*"(.*?)"\s*,\s*&(\w+)\s*\)/g;
  
  const functions: CppFunction[] = [];
  const functionMap = new Map<string, CppFunction>();
  
  // First pass: collect all function definitions
  let match;
  while ((match = functionRegex.exec(cppCode)) !== null) {
    const [_, returnType, name, params] = match;
    const parameters = params.split(',').map(param => {
      const trimmed = param.trim();
      // Handle const and reference types
      const parts = trimmed.split(/\s+/);
      let type = '';
      let paramName = '';
      
      if (parts[0] === 'const') {
        type = parts.slice(0, 2).join(' ');
        paramName = parts[2];
      } else {
        type = parts[0];
        paramName = parts[1];
      }
      
      // Clean up any reference or pointer symbols
      type = type.replace(/&|\*$/, '').trim();
      
      return { type, name: paramName };
    });
    
    functionMap.set(name, { name, returnType, parameters });
  }
  
  // Second pass: find the bound functions
  while ((match = bindRegex.exec(cppCode)) !== null) {
    const [_, exposedName, functionName] = match;
    const func = functionMap.get(functionName);
    if (func) {
      functions.push({ ...func, name: exposedName });
    }
  }

  return functions;
}

// Function to convert C++ types to TypeScript types
function cppToTsType(cppType: string): string {
  const typeMap: Record<string, string> = {
    'int': 'number',
    'float': 'number',
    'double': 'number',
    'bool': 'boolean',
    'string': 'string',
    'std::string': 'string',
    'void': 'void',
    'char': 'string',
    'unsigned': 'number',
    'long': 'number',
    'short': 'number',
    'const string': 'string',
    'const std::string': 'string'
  };
  
  return typeMap[cppType] || 'any';
}

// Function to generate TypeScript declarations
function generateTypeScriptDeclarations(functions: CppFunction[]): string {
  const declarations = functions.map(func => {
    const params = func.parameters.map(p => `${p.name}: ${cppToTsType(p.type)}`).join(', ');
    const returnType = cppToTsType(func.returnType);
    return `  ${func.name}: (${params}) => ${returnType};`;
  }).join('\n');
  
  const exports = functions.map(func => {
    const params = func.parameters.map(p => `${p.name}: ${cppToTsType(p.type)}`).join(', ');
    const returnType = cppToTsType(func.returnType);
    return `export const ${func.name}: (${params}) => ${returnType};`;
  }).join('\n');
  
  return `declare module '*.cpp' {
  const mod: {
${declarations}
  };
  export default mod;
  ${exports}
}
`;
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

      // Create output directory if it doesn't exist
      const outputDir = path.join(process.cwd(), 'node_modules', '.cpp-wasm');
      await fs.mkdir(outputDir, { recursive: true });

      const baseName = path.basename(id, '.cpp');
      const jsOut = path.join(outputDir, baseName + '.js');
      const wasmOut = path.join(outputDir, baseName + '.wasm');
      const dtsOut = path.join(path.dirname(id), baseName + '.d.ts');

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

      // Emit the .wasm file so Vite can serve it
      const wasmSource = await fs.readFile(wasmOut);
      this.emitFile({
        type: 'asset',
        fileName: path.basename(wasmOut),
        source: wasmSource
      });

      const exports = functions.map(func => `export const ${func.name} = mod.${func.name};`).join('\n');  

      // Return re-export stub with function information
      return `
        import factory from '${jsOut}';
        const mod = await factory();
        ${exports}
        export default mod;
      `;
    }
  };
}
