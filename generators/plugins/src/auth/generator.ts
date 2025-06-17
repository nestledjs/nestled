import { formatFiles, generateFiles, joinPathFragments, Tree } from '@nx/devkit'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'
import { addToModules } from '@nestledjs/utils'

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

  // Add exports to /libs/api/custom/src/index.ts
  const indexPath = 'libs/api/custom/src/index.ts'
  const exportPaths = ['./lib/plugins/auth/auth.module']
  let content = ''
  if (tree.exists(indexPath)) {
    content = tree.read(indexPath, 'utf-8')
  }
  let updated = false
  for (const path of exportPaths) {
    const exportStatement = `export * from '${path}'\n`
    if (!content.includes(exportStatement.trim())) {
      content += (content.endsWith('\n') ? '' : '\n') + exportStatement
      updated = true
    }
  }
  if (updated || !tree.exists(indexPath)) {
    tree.write(indexPath, content)
  }

  await formatFiles(tree)
}
