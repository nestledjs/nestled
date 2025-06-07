import { Tree, formatFiles, generateFiles, readProjectConfiguration } from '@nx/devkit';
import { log } from '../workspace-setup/lib/helpers';
import * as fs from 'fs';
import * as path from 'path';

interface ApiGenGeneratorSchema {
  overwritePrettier?: boolean;
  generateEnv?: boolean;
  generateDocker?: boolean;
  ignoreEnv?: boolean;
}

function configurePnpmAllowBuilds(tree: Tree) {
  const npmrcPath = '.npmrc';
  let content = '';
  
  if (tree.exists(npmrcPath)) {
    content = tree.read(npmrcPath)?.toString() || '';
    if (!content.includes('enable-pre-post-scripts')) {
      content += '\nenable-pre-post-scripts=true\n';
    }
    if (!content.includes('auto-install-peers')) {
      content += 'auto-install-peers=true\n';
    }
    if (!content.includes('strict-peer-dependencies')) {
      content += 'strict-peer-dependencies=false\n';
    }
  } else {
    content = `enable-pre-post-scripts=true
auto-install-peers=true
strict-peer-dependencies=false`;
  }

  tree.write(npmrcPath, content);
  log('Configured pnpm to automatically allow builds');
}

async function runGenerator(tree: Tree, generator: string, options: Record<string, unknown> = {}) {
  log(`Running generator: ${generator}`);
  try {
    const { default: generatorFn } = await import(generator);
    await generatorFn(tree, options);
    log(`Successfully completed: ${generator}`);
  } catch (error) {
    console.error(`Error running generator ${generator}:`, error);
    throw error;
  }
}

export default async function apiGenGenerator(tree: Tree, options: ApiGenGeneratorSchema) {
  // Configure pnpm first
  configurePnpmAllowBuilds(tree);

  const generators = [
    {
      name: '@nestled/generators:project-config',
      options: {
        overwritePrettier: options.overwritePrettier,
        generateEnv: options.generateEnv,
        generateDocker: options.generateDocker,
        ignoreEnv: options.ignoreEnv
      }
    },
    {
      name: '@nestled/generators:api-dependencies',
      options: {}
    },
    {
      name: '@nestled/generators:api-app',
      options: {}
    },
    {
      name: '@nestled/generators:api-files',
      options: {}
    },
    {
      name: '@nestled/generators:workspace-setup',
      options: {}
    }
  ];

  log('Starting API generation sequence');

  try {
    for (const generator of generators) {
      await runGenerator(tree, generator.name, generator.options);
    }
    await formatFiles(tree);
    log('API generation sequence completed successfully!');
  } catch (error) {
    console.error('API generation sequence failed:', error);
    throw error;
  }
} 