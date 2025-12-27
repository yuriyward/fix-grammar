import * as path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: (() => {
    const plugins = [
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
      }),
      tailwindcss(),
      react({
        babel: {
          plugins: ['babel-plugin-react-compiler'],
        },
      }),
    ];

    const analyze = process.env.BUNDLE_ANALYZE === 'true';
    if (analyze) {
      plugins.push(
        visualizer({
          filename: './.vite/bundle-stats.html',
          open: process.env.BUNDLE_ANALYZE_OPEN === 'true',
          gzipSize: true,
        }),
      );
    }

    return plugins;
  })(),
  resolve: {
    preserveSymlinks: true,
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
