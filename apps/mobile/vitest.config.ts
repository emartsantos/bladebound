import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    tsconfigRaw: {},
  },
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.ts'],
    exclude: ['e2e/**'],
  },
});