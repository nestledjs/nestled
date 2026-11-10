import { defineConfig } from 'vite'

// Nx 24 removed the nxViteTsPaths / nxCopyAssetsPlugin helpers. Neither was load-bearing here:
// the specs import no tsconfig path aliases, and the package is built by @nx/js:tsc (which copies
// *.md itself), so vite only runs vitest.
export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../node_modules/.vite/generators',
  test: {
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../coverage/generators',
      provider: 'v8' as const,
    },
  },
}))
