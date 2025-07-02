import { formatFiles, generateFiles, joinPathFragments, Tree } from '@nx/devkit'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'
import { libraryGenerator } from '@nx/js'

export default async function generator(tree: Tree) {
  const overwrite = false
  const npmScope = getNpmScope(tree)
  await libraryGenerator(tree, {
    name: 'apollo',
    directory: 'libs/shared/apollo',
    importPath: `@${npmScope}/shared/apollo`,
    linter: 'eslint',
    unitTestRunner: 'vitest',
  })
  const destRoot = joinPathFragments('libs', 'shared', 'apollo')
  const templateSource = joinPathFragments(__dirname, 'files')

  tree.delete(joinPathFragments(destRoot, 'src', 'lib'))

  generateFiles(tree, templateSource, destRoot, {
    tmpl: '',
    npmScope,
    overwrite,
  })

  await formatFiles(tree)
}
