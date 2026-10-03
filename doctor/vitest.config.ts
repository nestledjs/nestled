import { defineConfig } from 'vitest/config'

export default defineConfig({
  root: __dirname,
  test: {
    globals: false,
    environment: 'node',
    // .mjs specs alongside .ts ones: the select verifiers are ESM by design.
    include: ['src/**/*.spec.{ts,mjs}'],
    reporters: ['default'],
  },
})
