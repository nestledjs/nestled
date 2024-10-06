import { joinPathFragments, Tree } from '@nx/devkit'

export function deleteFiles(tree: Tree, filesToDelete: string[]) {
  filesToDelete.forEach((file) => {
    if (tree.exists(file)) {
      tree.delete(file)
    }
  })
}

// List of files to delete
// const filesToDelete = [
//   // Add any other files you want to delete
// ]

// Delete unwanted files
// deleteFiles(tree, filesToDelete)

export function deleteDirectory(tree: Tree, dirPath: string) {
  if (tree.exists(dirPath)) {
    tree.children(dirPath).forEach((child) => {
      const childPath = joinPathFragments(dirPath, child)
      if (tree.isFile(childPath)) {
        tree.delete(childPath)
      } else {
        deleteDirectory(tree, childPath)
      }
    })
    tree.delete(dirPath)
  }
}

// List of directories to delete
// const directoriesToDelete = [
//   // Add any other directories you want to delete
// ]
// Delete unwanted directories
// directoriesToDelete.forEach((dir) => deleteDirectory(tree, dir))

// Optionally, update package.json or other configuration files
// updateJson(tree, 'apps/your-app/package.json', (json) => {
//   // Remove unwanted scripts, dependencies, etc.
//   delete json.scripts.someUnwantedScript;
//   delete json.dependencies.someUnwantedDependency;
//   return json;
// });
