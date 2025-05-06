import { defineConfig } from 'vite';
import cppStubPlugin from './vite-plugin-cpp';

export default defineConfig({
  plugins: [cppStubPlugin()],
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        format: 'es'
      }
    }
  }
});