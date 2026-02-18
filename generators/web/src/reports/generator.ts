import { formatFiles, generateFiles, joinPathFragments, Tree } from '@nx/devkit'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'

export default async function generator(tree: Tree) {
  const npmScope = getNpmScope(tree)
  const targetPath = 'apps/web/app/features/reports'

  generateFiles(tree, joinPathFragments(__dirname, './files'), targetPath, {
    tmpl: '',
    npmScope,
  })

  await formatFiles(tree)
}
