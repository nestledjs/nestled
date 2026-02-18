import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Handle __dirname in ESM
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url))

export default mergeConfig(
  viteConfig,
  defineConfig({
    optimizeDeps: {
      include: ['@mdxeditor/editor'],
    },
    ssr: {
      noExternal: ['@mdxeditor/editor'],
    },
    resolve: {
      alias: {
        '@nestledjs/forms': path.resolve(dirname, 'dist'),
        '@forms': path.resolve(dirname, 'src/lib'),
      },
    },
    test: {
      testTimeout: 30000, // 30s
      hookTimeout: 30000,
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
      css: {
        include: [/\.css$/],
        modules: {
          classNameStrategy: 'non-scoped',
        },
      },
    },
  }),
)
