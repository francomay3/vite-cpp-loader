import { promises as fs } from 'node:fs';
import type { CppFunction } from './types';

export const CPP_TO_TS: Record<string, string> = {
  'int': 'number',
  'float': 'number',
  'double': 'number',
  'bool': 'boolean',
  'void': 'void',
  'char': 'string',
  'unsigned': 'number',
  'long': 'number',
  'short': 'number',
  'string': 'string',
  'std::string': 'string',
  'const string': 'string',
  'const std::string': 'string',
  'int32_t': 'number',
  'int64_t': 'number',
  'uint32_t': 'number',
  'uint64_t': 'number',
  'size_t': 'number',
  'const char *': 'string',
  'char *': 'string',
  'emscripten::val': 'any',
};

function mapType(cppType: string): string {
  const normalized = cppType.replace(/\s*[&*]\s*$/, '').trim();
  return CPP_TO_TS[normalized] ?? 'any';
}

export function parseTsd(tsdContent: string): CppFunction[] {
  const functions: CppFunction[] = [];
  const methodRegex = /^\s{2}(\w+)\(([^)]*)\):\s*(\S+);/;

  for (const line of tsdContent.split('\n')) {
    const match = line.match(methodRegex);
    if (!match) continue;

    const [, name, rawParams, returnType] = match;
    const parameters = rawParams.trim() === ''
      ? []
      : rawParams.split(',').map(p => {
          const paramMatch = p.trim().match(/^(\w+)\s*:\s*(.+)$/);
          if (!paramMatch) return { name: 'p', type: 'any' };
          return { name: paramMatch[1], type: paramMatch[2].trim() };
        });

    functions.push({ name, returnType: returnType.replace(';', ''), parameters });
  }

  return functions;
}

export function parseRegexFallback(cppSource: string): CppFunction[] {
  // Strip comments then normalize whitespace for multiline signatures
  const stripped = cppSource
    .replace(/\/\/[^\n]*/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\n/g, ' ');

  const functionMap = new Map<string, CppFunction>();
  const functionRegex = /(\w[\w\s:]*?)\s+(\w+)\s*\(([^)]*)\)\s*\{/g;
  const bindRegex = /emscripten::function\s*\(\s*"(.*?)"\s*,\s*&(\w+)\s*\)/g;

  let match: RegExpExecArray | null;

  while ((match = functionRegex.exec(stripped)) !== null) {
    const [, rawReturn, name, rawParams] = match;
    const returnType = mapType(rawReturn.trim());
    const parameters = rawParams.trim() === ''
      ? []
      : rawParams.split(',').map(param => {
          const parts = param.trim().split(/\s+/);
          let type = '';
          let paramName = '';

          if (parts[0] === 'const' && parts.length >= 3) {
            type = mapType(parts.slice(0, 2).join(' '));
            paramName = parts[2]?.replace(/[&*]/g, '') ?? '';
          } else {
            type = mapType(parts[0] ?? '');
            paramName = parts[1]?.replace(/[&*]/g, '') ?? '';
          }

          return { type, name: paramName };
        });

    functionMap.set(name, { name, returnType, parameters });
  }

  const functions: CppFunction[] = [];
  while ((match = bindRegex.exec(stripped)) !== null) {
    const [, exposedName, cppName] = match;
    const func = functionMap.get(cppName);
    if (func) functions.push({ ...func, name: exposedName });
  }

  return functions;
}

export async function extractFunctions(id: string, tsdPath: string | null): Promise<CppFunction[]> {
  if (tsdPath) {
    try {
      const content = await fs.readFile(tsdPath, 'utf-8');
      if (content.trim().length > 0) return parseTsd(content);
    } catch {
      // fall through to regex
    }
  }

  const cppSource = await fs.readFile(id, 'utf-8');
  return parseRegexFallback(cppSource);
}
