import { addDependenciesToPackageJson, Tree, formatFiles } from '@nx/devkit';

export default async function (tree: Tree) {
  // Install all required dependencies first
  const installTask = addDependenciesToPackageJson(
    tree,
    {},
    {
      '@nx/nest': 'latest',
      '@nx/node': 'latest',
      '@nx/webpack': 'latest'
    }
  );

  await formatFiles(tree);
  
  return installTask;
} 