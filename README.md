# vite-cpp-loader

A Vite plugin that lets you import C++ files directly into your TypeScript/JavaScript code. Write your C++ functions and use them in your frontend code with full type safety and hot module reloading. Under the hood, it uses Emscripten to compile your C++ code to WebAssembly, but you don't need to worry about that - just import and use your C++ functions as if they were TypeScript functions.

## Features

- 🔄 Automatic C++ to WebAssembly compilation
- 📝 TypeScript declaration generation
- 🚀 Seamless integration with Vite
- 🔌 Zero configuration setup
- 🧩 Emscripten integration for C++ bindings
- 📦 Automatic type inference from C++ to TypeScript

## Prerequisites

### Emscripten Installation

1. **macOS**:
   ```bash
   # Using Homebrew
   brew install emscripten
   
   # Or using the official installer
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   ./emsdk install latest
   ./emsdk activate latest
   source ./emsdk_env.sh
   ```

2. **Windows**:
   ```bash
   # Using the official installer
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   emsdk install latest
   emsdk activate latest
   emsdk_env.bat
   ```

3. **Linux**:
   ```bash
   # Using the official installer
   git clone https://github.com/emscripten-core/emsdk.git
   cd emsdk
   ./emsdk install latest
   ./emsdk activate latest
   source ./emsdk_env.sh
   ```

Verify the installation:
```bash
emcc --version
```

### VSCode Configuration

To get proper C++ IntelliSense in VSCode, create a `.vscode/c_cpp_properties.json` file in your project:

```json
{
  "configurations": [
    {
      "name": "Emscripten",
      "includePath": [
        "${workspaceFolder}/**",
        "/usr/local/opt/emscripten/libexec/emscripten/system/include/**",
        "C:/emsdk/upstream/emscripten/system/include/**",
        "~/emsdk/upstream/emscripten/system/include/**"
      ],
      "macFrameworkPath": [],
      "compilerPath": "/usr/local/opt/emscripten/libexec/emscripten/emcc",
      "cStandard": "c17",
      "cppStandard": "c++17",
      "intelliSenseMode": "clang-x64"
    }
  ],
  "version": 4
}
```

To find the correct Emscripten include path:

1. **macOS**:
   ```bash
   # If installed via Homebrew
   ls /usr/local/opt/emscripten/libexec/emscripten/system/include
   
   # If installed via emsdk
   ls ~/emsdk/upstream/emscripten/system/include
   ```

2. **Windows**:
   ```bash
   # Usually located at
   dir C:\emsdk\upstream\emscripten\system\include
   ```

3. **Linux**:
   ```bash
   # Usually located at
   ls ~/emsdk/upstream/emscripten/system/include
   ```

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
import cppLoader from 'vite-cpp-loader';

export default defineConfig({
  plugins: [
    cppLoader()
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

## Troubleshooting

### Common Issues

1. **Emscripten not found**:
   - Make sure Emscripten is properly installed and in your PATH
   - Try running `emcc --version` to verify the installation
   - On Windows, you might need to restart your terminal after installation

2. **Missing include files**:
   - Verify your VSCode configuration has the correct include paths
   - Make sure Emscripten is properly installed
   - Try running `emcc -v` to see the include paths Emscripten is using

3. **Compilation errors**:
   - Check that your C++ code is valid
   - Make sure you're using the correct Emscripten bindings syntax
   - Verify that all required headers are included

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT 