import { describe, it, expect } from 'vitest';
import { generateDeclarations } from '../src/declarations.js';
import type { CppFunction } from '../src/types.js';

describe('generateDeclarations', () => {
  it('produces empty string for an empty function list', () => {
    expect(generateDeclarations([])).toBe('\n');
  });

  it('does not emit init()', () => {
    const result = generateDeclarations([]);
    expect(result).not.toContain('init');
  });

  it('does not wrap return type in Promise<T>', () => {
    const funcs: CppFunction[] = [{ name: 'add', returnType: 'number', parameters: [] }];
    expect(generateDeclarations(funcs)).not.toContain('Promise');
  });

  it('uses export declare function syntax', () => {
    const funcs: CppFunction[] = [{ name: 'add', returnType: 'number', parameters: [] }];
    expect(generateDeclarations(funcs)).toContain('export declare function add');
  });

  it('serializes parameters correctly', () => {
    const funcs: CppFunction[] = [{
      name: 'add',
      returnType: 'number',
      parameters: [
        { name: 'a', type: 'number' },
        { name: 'b', type: 'number' },
      ],
    }];
    expect(generateDeclarations(funcs)).toContain('add(a: number, b: number): number');
  });

  it('produces empty parens for zero-parameter functions', () => {
    const funcs: CppFunction[] = [{ name: 'getVersion', returnType: 'string', parameters: [] }];
    expect(generateDeclarations(funcs)).toContain('getVersion(): string');
  });

  it('handles multiple functions in order', () => {
    const funcs: CppFunction[] = [
      { name: 'add', returnType: 'number', parameters: [{ name: 'a', type: 'number' }, { name: 'b', type: 'number' }] },
      { name: 'greet', returnType: 'string', parameters: [{ name: 'name', type: 'string' }] },
    ];
    const result = generateDeclarations(funcs);
    expect(result.indexOf('add')).toBeLessThan(result.indexOf('greet'));
  });

  it('ends with a newline', () => {
    const funcs: CppFunction[] = [{ name: 'add', returnType: 'number', parameters: [] }];
    expect(generateDeclarations(funcs)).toMatch(/\n$/);
  });
});
