import { describe, it, expect } from 'vitest';
import { CPP_TO_TS } from '../src/parser.js';

describe('CPP_TO_TS type map', () => {
  it.each([
    ['int', 'number'],
    ['float', 'number'],
    ['double', 'number'],
    ['unsigned', 'number'],
    ['long', 'number'],
    ['short', 'number'],
    ['bool', 'boolean'],
    ['void', 'void'],
    ['char', 'string'],
    ['string', 'string'],
    ['std::string', 'string'],
    ['const string', 'string'],
    ['const std::string', 'string'],
  ])('maps original type %s → %s', (cppType, tsType) => {
    expect(CPP_TO_TS[cppType]).toBe(tsType);
  });

  it.each([
    ['int32_t', 'number'],
    ['int64_t', 'number'],
    ['uint32_t', 'number'],
    ['uint64_t', 'number'],
    ['size_t', 'number'],
    ['const char *', 'string'],
    ['char *', 'string'],
    ['emscripten::val', 'any'],
  ])('maps extended type %s → %s', (cppType, tsType) => {
    expect(CPP_TO_TS[cppType]).toBe(tsType);
  });

  it('returns undefined for unknown types (caller maps to any)', () => {
    expect(CPP_TO_TS['SomeCustomClass']).toBeUndefined();
  });

  it('is case-sensitive', () => {
    expect(CPP_TO_TS['Int']).toBeUndefined();
    expect(CPP_TO_TS['Bool']).toBeUndefined();
  });
});
