import { defineConfig } from 'vite';
import cppLoader from '../../src';

export default defineConfig({
  plugins: [
    cppLoader()
  ]
}); 