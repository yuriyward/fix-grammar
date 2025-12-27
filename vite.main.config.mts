import path from 'node:path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      external: [
        // Externalize nut-js and its native dependencies
        '@nut-tree-fork/nut-js',
        '@nut-tree-fork/libnut-darwin',
        '@nut-tree-fork/libnut-linux',
        '@nut-tree-fork/libnut-win32',
      ],
    },
  },
});
