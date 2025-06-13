import { Tree, formatFiles, generateFiles, joinPathFragments } from '@nx/devkit'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'
import { addToModules } from '@nestled/utils'

export default async function generator(tree: Tree) {
  const directory = 'api/custom/src/lib/plugins'
  const overwrite = false
  const npmScope = getNpmScope(tree)
  const destRoot = joinPathFragments('libs', directory, 'auth')
  const templateSource = joinPathFragments(__dirname, 'files')

  generateFiles(tree, templateSource, destRoot, {
    tmpl: '',
    npmScope,
    overwrite,
  })

  addToModules({
    tree,
    modulePath: 'apps/api/src/app.module.ts',
    moduleArrayName: 'pluginModules',
    moduleToAdd: 'AuthModule',
    importPath: `@${npmScope}/api/custom`,
  })

  // Add export to /libs/api/custom/src/index.ts
  const indexPath = 'libs/api/custom/src/index.ts'
  const exportStatement = `export * from './lib/plugins/auth/auth.module'\n`
  if (tree.exists(indexPath)) {
    const content = tree.read(indexPath, 'utf-8')
    if (!content.includes(exportStatement.trim())) {
      tree.write(indexPath, content + '\n' + exportStatement)
    }
  } else {
    tree.write(indexPath, exportStatement)
  }

  await formatFiles(tree)
}
