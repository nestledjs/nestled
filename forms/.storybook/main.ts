import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import type { StorybookConfig } from '@storybook/react-vite'
import { mergeConfig } from 'vite'

const require = createRequire(import.meta.url);

const config: StorybookConfig = {
  stories: ['../src/lib/**/*.@(mdx|stories.@(js|jsx|ts|tsx))'],
  addons: [getAbsolutePath("@storybook/addon-vitest"), getAbsolutePath("@storybook/addon-a11y"), getAbsolutePath("@storybook/addon-docs")],
  framework: {
    name: getAbsolutePath("@storybook/react-vite"),
    options: {
      builder: {
        viteConfigPath: 'vite.config.ts',
      },
    },
  },
  async viteFinal(config) {
    return mergeConfig(config, {
      optimizeDeps: {
        include: ['@mdxeditor/editor'],
      },
      ssr: {
        noExternal: ['@mdxeditor/editor'],
      },
    })
  },
}

export default config

// To customize your Vite configuration you can use the viteFinal field.
// Check https://storybook.js.org/docs/react/builders/vite#configuration
// and https://nx.dev/recipes/storybook/custom-builder-configs

function getAbsolutePath(value: string): any {
  return dirname(require.resolve(join(value, "package.json")));
}
