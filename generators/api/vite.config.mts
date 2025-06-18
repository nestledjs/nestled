/// <reference types="vitest" />
import { defineConfig } from 'vite'
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/generators/api',
  plugins: [nxCopyAssetsPlugin(['*.md']), tsconfigPaths()],
  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    pool: 'threads',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    watch: false,
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/generators/api',
      provider: 'v8' as const,
    },
  },
}))
