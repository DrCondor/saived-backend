import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./app/javascript/workspace/tests/setup.ts'],
    include: ['app/javascript/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['app/javascript/workspace/**/*.{ts,tsx}'],
      exclude: [
        'app/javascript/workspace/tests/**',
        'app/javascript/workspace/index.tsx',
        '**/*.d.ts',
      ],
      reporter: ['text', 'lcov'],
    },
  },
  resolve: {
    alias: {
      '@': '/app/javascript/workspace',
    },
  },
});
