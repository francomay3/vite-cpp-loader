# vite-cpp-loader

Import `.cpp` files directly into TypeScript. Functions compile to WebAssembly and are callable with full type safety.

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
npm install vite-cpp-loader --save-dev
```

## Setup

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import cppLoader from 'vite-cpp-loader';

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

## Troubleshooting

**`em++` not found** — make sure Emscripten is installed and in your `PATH`. If you installed via emsdk, run `source ./emsdk_env.sh` before starting the dev server.

## License

MIT
