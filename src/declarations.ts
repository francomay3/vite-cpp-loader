import type { CppFunction } from './types';

export function generateDeclarations(functions: CppFunction[]): string {
  const lines = functions.map(func => {
    const params = func.parameters.map(p => `${p.name}: ${p.type}`).join(', ');
    return `export declare function ${func.name}(${params}): ${func.returnType};`;
  });

  return lines.join('\n') + '\n';
}
