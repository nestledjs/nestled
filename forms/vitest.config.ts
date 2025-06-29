import { defineConfig, mergeConfig } from 'vitest/config'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import viteConfig from './vite.config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Handle __dirname in ESM
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url))

export default mergeConfig(
  viteConfig,
  defineConfig({
    resolve: {
      alias: {
        '@nestledjs/forms': path.resolve(dirname, 'dist'),
        '@forms': path.resolve(dirname, 'src/lib'),
      },
    },
    test: {
      // Vitest project mode
      projects: [
        // ✅ Regular unit/component tests
        {
          ...viteConfig,
          test: {
            ...viteConfig.test,
            name: 'unit',
            include: ['src/**/*.{test,spec}.{ts,tsx}'],
            css: {
              include: [/\.css$/],
              modules: {
                classNameStrategy: 'non-scoped',
              },
            },
          },
        },

        // ✅ Storybook interaction tests
        {
          ...viteConfig,
          plugins: [
            ...(viteConfig.plugins ?? []),
            storybookTest({
              configDir: path.join(dirname, '.storybook'),
              storybookScript: 'nx run forms:storybook --ci',
            }),
          ],
          test: {
            ...viteConfig.test,
            name: 'storybook',
            setupFiles: ['./.storybook/vitest.setup.ts'],
            css: {
              include: [/\.css$/],
              modules: {
                classNameStrategy: 'non-scoped',
              },
            },
            browser: {
              enabled: true,
              provider: 'playwright',
              headless: true,
              instances: [{ browser: 'chromium' }],
            },
          },
        },
      ],
    },
  }),
)
