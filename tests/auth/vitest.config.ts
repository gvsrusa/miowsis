import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./setup.ts'],
    globals: true,
    coverage: {
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'tests/**',
        '**/*.d.ts',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'coverage/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '../../frontend/src'),
      '@services': resolve(__dirname, '../../frontend/src/services'),
      '@hooks': resolve(__dirname, '../../frontend/src/hooks'),
      '@components': resolve(__dirname, '../../frontend/src/components'),
      '@store': resolve(__dirname, '../../frontend/src/store')
    }
  }
});