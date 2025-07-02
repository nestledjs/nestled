import { Tree, formatFiles, generateFiles, joinPathFragments } from '@nx/devkit';

export default async function generator(tree: Tree) {
  // Use the Nx NestJS library generator to create 'integrations' in libs/api
  // This assumes @nx/nest is installed in the workspace
  const { execSync } = require('child_process');
  execSync('nx g @nx/nest:lib integrations --directory=libs/api/integrations', { stdio: 'inherit' });
  await formatFiles(tree);
} 