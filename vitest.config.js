import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.js',
        '**/*.spec.js',
        '**/dist/',
        '**/build/',
        '**/*.config.js',
      ],
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
    include: ['tests/**/*.test.js'],
    exclude: ['node_modules/', 'dist/', 'build/', 'js/**/*.js'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './js'),
      '@tests': resolve(__dirname, './tests'),
    },
  },
});