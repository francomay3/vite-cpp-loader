import cppToTsType from "./cppToTsType";
import { CppFunction } from "./types";

// Function to generate TypeScript declarations
export function generateTypeScriptDeclarations(functions: CppFunction[]): string {
    return functions.map(func => {
      const params = func.parameters.map(p => `${p.name}: ${cppToTsType(p.type)}`).join(', ');
      const returnType = cppToTsType(func.returnType);
      return `export const ${func.name}: (${params}) => Promise<${returnType}>;`;
    }).join('\n');
  }