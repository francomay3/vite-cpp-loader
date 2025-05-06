# vite-cpp-loader

A Vite plugin that enables seamless integration of C++ code with WebAssembly in your Vite projects. This plugin automatically compiles C++ files to WebAssembly and generates TypeScript declarations, making it easy to use C++ functions directly in your TypeScript/JavaScript code.

## Features

- 🔄 Automatic C++ to WebAssembly compilation
- 📝 TypeScript declaration generation
- 🚀 Seamless integration with Vite
- 🔌 Zero configuration setup
- 🧩 Emscripten integration for C++ bindings
- 📦 Automatic type inference from C++ to TypeScript

## Prerequisites

- [Emscripten](https://emscripten.org/docs/getting_started/downloads.html) installed and configured
- Node.js 16+ and npm/yarn
- Vite project

## Installation

```bash
npm install vite-cpp-loader --save-dev
# or
yarn add vite-cpp-loader --dev
```

## Usage

1. Add the plugin to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import cppWasm from 'vite-plugin-cpp-wasm';

export default defineConfig({
  plugins: [
    cppWasm()
  ]
});
```

2. Create a C++ file (e.g., `math.cpp`):

```cpp
#include <emscripten/bind.h>
#include <string>

int add(int a, int b) {
    return a + b;
}

std::string greet(const std::string& name) {
    return "Hello, " + name + "!";
}

EMSCRIPTEN_BINDINGS(my_module) {
    emscripten::function("add", &add);
    emscripten::function("greet", &greet);
}
```

3. Import and use in your TypeScript/JavaScript:

```typescript
import { add, greet } from './math.cpp';

// Use the C++ functions directly
console.log(add(2, 3)); // 5
console.log(greet("World")); // "Hello, World!"
```

## How It Works

The plugin:
1. Detects `.cpp` files in your project
2. Extracts function declarations and their types
3. Generates TypeScript declarations automatically
4. Compiles C++ to WebAssembly using Emscripten
5. Provides type-safe access to your C++ functions

## Type Support

The plugin automatically converts C++ types to TypeScript types:

| C++ Type | TypeScript Type |
|----------|-----------------|
| int      | number          |
| float    | number          |
| double   | number          |
| bool     | boolean         |
| string   | string          |
| void     | void            |
| char     | string          |
| unsigned | number          |
| long     | number          |
| short    | number          |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT 