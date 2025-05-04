import { Plugin } from 'vite';

export default function cppStubPlugin(): Plugin {
  return {
    name: 'vite-plugin-cpp-stub',

    // Step 1: Handle .cpp files
    async load(id) {
      if (id.endsWith('.cpp')) {
        // Just return a dummy module for now
        return `export default () => console.log("Hello from ${id}");`;
      }
    }
  };
}
