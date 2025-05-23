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
        "~/emsdk/upstream/emscripten/system/include/**",
        "/opt/homebrew/include/emscripten"
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

**Note:** Since WebAssembly module initialization is asynchronous, all imported C++ functions return Promises. You need to use `await` when calling them:

```typescript
import { add, greet } from './math.cpp';

// Use async/await to handle the Promises
const result = await add(2, 3);
console.log(result); // 5

// Or use Promise chaining
greet("World").then(result => {
  console.log(result); // "Hello, World!"
});
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

**Note:** Only simple types can be used as function return types. Complex types (like STL containers, custom classes, etc.) are not currently supported.

## Generated TypeScript Declarations

For each C++ module, a TypeScript declaration file (`.d.ts`) is automatically generated in the same directory as the C++ file. For example, if you have `math.cpp`, a `math.cpp.d.ts` file will be generated. These files contain the type definitions that enable TypeScript type checking and IntelliSense.

**Important**: These generated declaration files should not be modified manually as they are automatically generated and will be overwritten. It's recommended to add them to your `.gitignore` file:

```gitignore
# Generated TypeScript declarations for C++ modules
*.cpp.d.ts
```

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