/// <reference types="vitest" />

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // css: true,
    coverage: {
      provider: 'istanbul',
      reportsDirectory: './coverage',
    },
  },
  build: {
    manifest: true,
  },
});
