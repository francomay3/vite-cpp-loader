import { describe, it, expect } from 'vitest';
import { parseTsd, parseRegexFallback, extractTopLevelFunctionNames, buildAutoBindings } from '../src/parser';

describe('parseTsd', () => {
  it('returns empty array for empty interface', () => {
    expect(parseTsd('interface MainModule {\n}\n')).toEqual([]);
  });

  it('parses a no-parameter method', () => {
    const tsd = `interface MainModule {\n  getVersion(): string;\n}\n`;
    const result = parseTsd(tsd);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: 'getVersion', returnType: 'string', parameters: [] });
  });

  it('parses a method with parameters', () => {
    const tsd = `interface MainModule {\n  add(_0: number, _1: number): number;\n}\n`;
    const [func] = parseTsd(tsd);
    expect(func.name).toBe('add');
    expect(func.returnType).toBe('number');
    expect(func.parameters).toEqual([
      { name: '_0', type: 'number' },
      { name: '_1', type: 'number' },
    ]);
  });

  it('parses a method with 4 parameters', () => {
    const tsd = `interface MainModule {\n  quad(_0: number, _1: number, _2: number, _3: number): number;\n}\n`;
    const [func] = parseTsd(tsd);
    expect(func.parameters).toHaveLength(4);
  });

  it('ignores non-method lines (readonly properties, comments, type aliases)', () => {
    const tsd = [
      'interface MainModule {',
      '  readonly HEAP8: Int8Array;',
      '  // a comment',
      '  add(_0: number, _1: number): number;',
      '}',
    ].join('\n');
    const result = parseTsd(tsd);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('add');
  });

  it('handles string return type', () => {
    const tsd = `interface MainModule {\n  greet(_0: string): string;\n}\n`;
    const [func] = parseTsd(tsd);
    expect(func.returnType).toBe('string');
  });
});

describe('parseRegexFallback', () => {
  const basicCpp = `
#include <emscripten/bind.h>
int add(int a, int b) { return a + b; }
EMSCRIPTEN_BINDINGS(m) { emscripten::function("add", &add); }
`;

  it('extracts a basic function', () => {
    const result = parseRegexFallback(basicCpp);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ name: 'add', returnType: 'number' });
  });

  it('maps int parameters to number', () => {
    const [func] = parseRegexFallback(basicCpp);
    expect(func.parameters[0].type).toBe('number');
    expect(func.parameters[1].type).toBe('number');
  });

  it('handles std::string return type', () => {
    const cpp = `
#include <emscripten/bind.h>
#include <string>
std::string greet(const std::string& name) { return name; }
EMSCRIPTEN_BINDINGS(m) { emscripten::function("greet", &greet); }
`;
    const result = parseRegexFallback(cpp);
    expect(result).toHaveLength(1);
    expect(result[0].returnType).toBe('string');
  });

  it('handles const std::string& parameter', () => {
    const cpp = `
std::string greet(const std::string& name) { return name; }
EMSCRIPTEN_BINDINGS(m) { emscripten::function("greet", &greet); }
`;
    const [func] = parseRegexFallback(cpp);
    expect(func.parameters[0].type).toBe('string');
  });

  it('handles multiline function signatures', () => {
    const cpp = [
      'int add(',
      '  int a,',
      '  int b',
      ') { return a + b; }',
      'EMSCRIPTEN_BINDINGS(m) { emscripten::function("add", &add); }',
    ].join('\n');
    const result = parseRegexFallback(cpp);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('add');
  });

  it('maps unknown types to any', () => {
    const cpp = `
MyClass foo(MyClass x) { return x; }
EMSCRIPTEN_BINDINGS(m) { emscripten::function("foo", &foo); }
`;
    const [func] = parseRegexFallback(cpp);
    expect(func.returnType).toBe('any');
    expect(func.parameters[0].type).toBe('any');
  });

  it('uses the JS binding name, not the C++ function name', () => {
    const cpp = `
int internal_add(int a, int b) { return a + b; }
EMSCRIPTEN_BINDINGS(m) { emscripten::function("add", &internal_add); }
`;
    const [func] = parseRegexFallback(cpp);
    expect(func.name).toBe('add');
  });

  it('only returns functions that are bound', () => {
    const cpp = `
int add(int a, int b) { return a + b; }
int sub(int a, int b) { return a - b; }
EMSCRIPTEN_BINDINGS(m) { emscripten::function("add", &add); }
`;
    const result = parseRegexFallback(cpp);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('add');
  });
});

describe('extractTopLevelFunctionNames', () => {
  it('extracts a single function name', () => {
    const cpp = `int fib(int n) { return n; }`;
    expect(extractTopLevelFunctionNames(cpp)).toEqual(['fib']);
  });

  it('extracts multiple function names', () => {
    const cpp = `
int add(int a, int b) { return a + b; }
int sub(int a, int b) { return a - b; }
`;
    expect(extractTopLevelFunctionNames(cpp)).toEqual(['add', 'sub']);
  });

  it('skips static functions', () => {
    const cpp = `
static int helper(int x) { return x; }
int exported(int x) { return x; }
`;
    expect(extractTopLevelFunctionNames(cpp)).toEqual(['exported']);
  });

  it('ignores single-line comments', () => {
    const cpp = `
// int fake(int x) { return x; }
int real(int x) { return x; }
`;
    expect(extractTopLevelFunctionNames(cpp)).toEqual(['real']);
  });
});

describe('buildAutoBindings', () => {
  it('generates an EMSCRIPTEN_BINDINGS block', () => {
    const result = buildAutoBindings(['add', 'fib']);
    expect(result).toContain('EMSCRIPTEN_BINDINGS(module)');
    expect(result).toContain('emscripten::function("add", &add)');
    expect(result).toContain('emscripten::function("fib", &fib)');
    expect(result).toContain('#include <emscripten/bind.h>');
  });

  it('produces empty bindings block for no functions', () => {
    const result = buildAutoBindings([]);
    expect(result).toContain('EMSCRIPTEN_BINDINGS(module)');
  });
});
