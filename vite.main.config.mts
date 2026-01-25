import path from 'node:path';
import { defineConfig } from 'vite';
import { NATIVE_EXTERNAL_DEPS } from './src/shared/config/native-deps';

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
        // Externalize native dependencies (packaged separately)
        ...NATIVE_EXTERNAL_DEPS,
      ],
    },
  },
});
