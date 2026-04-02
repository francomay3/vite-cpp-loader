import type { CppFunction } from './types';

export function generateModule(jsPath: string, functions: CppFunction[]): string {
  const moduleUrl = jsPath.replace(/\\/g, '/');

  const exports = functions.map(func => {
    const paramNames = func.parameters.map(p => p.name).join(', ');
    return `export function ${func.name}(${paramNames}) { return _mod.${func.name}(${paramNames}); }`;
  }).join('\n');

  return `import createModule from '${moduleUrl}';

const _mod = await createModule();

${exports}
`;
}
