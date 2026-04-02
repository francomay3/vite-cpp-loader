# vite-plugin-cpp-loader

[![npm version](https://img.shields.io/npm/v/vite-plugin-cpp-loader)](https://www.npmjs.com/package/vite-plugin-cpp-loader)
[![license](https://img.shields.io/npm/l/vite-plugin-cpp-loader)](./LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/vite-plugin-cpp-loader)](https://www.npmjs.com/package/vite-plugin-cpp-loader)

Import `.cpp` files directly into TypeScript. Functions are automagically compiled to **WebAssembly via Emscripten** and callable with full type safety — no boilerplate, no manual `em++` invocations.

## Prerequisites

Emscripten must be installed and `em++` available in your `PATH`.

**macOS:**
```bash
brew install emscripten
```

**Linux / macOS (via emsdk):**
```bash
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk && ./emsdk install latest && ./emsdk activate latest
source ./emsdk_env.sh
```

**Windows:**
```bash
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk && emsdk install latest && emsdk activate latest && emsdk_env.bat
```

## Installation

```bash
npm install vite-plugin-cpp-loader --save-dev
```

## Setup

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import cppLoader from 'vite-plugin-cpp-loader';

export default defineConfig({
  plugins: [cppLoader()]
});
```

## Usage

Write plain C++ — no Emscripten boilerplate required. All top-level non-static functions are automatically exported.

**`math.cpp`**
```cpp
int add(int a, int b) {
    return a + b;
}
```

**`main.ts`**
```typescript
import { add } from './math.cpp';

add(2, 3); // 5
```

If you only want to export a subset of functions, mark the ones you want to keep internal as `static` and they will be excluded.

## Type safety

Types are inferred from your C++ signatures:

```typescript
import { add } from './math.cpp';

add(2, 3);     // ✅
add("2", 3);   // ❌ Argument of type 'string' is not assignable to parameter of type 'number'
```

Supported C++ → TypeScript mappings:

| C++ | TypeScript |
|-----|------------|
| `int`, `float`, `double`, `long`, `short`, `unsigned` | `number` |
| `int32_t`, `uint32_t`, `int64_t`, `uint64_t`, `size_t` | `number` |
| `bool` | `boolean` |
| `std::string`, `const char*` | `string` |
| `void` | `void` |
| `emscripten::val` | `any` |

Complex types (STL containers, custom classes) are not supported as parameters or return types.

## Options

```typescript
cppLoader({
  emccArgs: ['-sASSERTIONS=1'],   // extra flags passed to em++
  optimizationLevel: 'O3',         // default: 'O2'
  cacheDir: '.my-wasm-cache',      // default: 'node_modules/.cpp-wasm'
  setupVSCode: false,              // disable auto-generation of .vscode/c_cpp_properties.json
})
```

## How it works

1. Vite intercepts any `import` of a `.cpp` file.
2. The plugin invokes `em++` (Emscripten) to compile the C++ to a `.wasm` binary + a JS glue module.
3. Function bindings are generated automatically using **Embind** — no raw pointers or manual memory management.
4. TypeScript declarations are inferred from the C++ signatures so your editor gets full autocompletion.

The compiled `.wasm` is cached in `node_modules/.cpp-wasm` so rebuilds are near-instant when the source hasn't changed.

## Troubleshooting

**`em++` not found** — make sure Emscripten is installed and in your `PATH`. If you installed via emsdk, run `source ./emsdk_env.sh` before starting the dev server.

## License

MIT
