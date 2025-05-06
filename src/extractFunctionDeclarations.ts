import type { CppFunction } from './types';

// Function to extract function declarations from C++ code
export default function extractFunctionDeclarations(cppCode: string): CppFunction[] {
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