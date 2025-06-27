import { formatFiles, generateFiles, joinPathFragments, Tree } from '@nx/devkit'
import { libraryGenerator } from '@nx/js'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'

export default async function generator(tree: Tree) {
  const npmScope = getNpmScope(tree)
  // Create the library in libs/shared/styles
  await libraryGenerator(tree, {
    name: 'styles',
    directory: 'libs/shared/styles',
    importPath: `@${npmScope}/shared/styles`,
    linter: 'eslint',
    unitTestRunner: 'none',
    publishable: false,
    buildable: false,
  })
  const destRoot = joinPathFragments('libs', 'shared', 'styles', 'src')
  // Remove everything in src except what we want
  if (tree.exists(destRoot)) {
    tree.delete(destRoot)
  }
  // Generate app.css in src/lib and index.ts in src
  generateFiles(tree, joinPathFragments(__dirname, 'files'), destRoot, { tmpl: '' })
  await formatFiles(tree)
}
