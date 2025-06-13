import { Tree, formatFiles, generateFiles, joinPathFragments } from '@nx/devkit'
import * as fs from 'fs'
import * as path from 'path'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'
import { addToModules } from 'generators/utils/src/lib/generator-utils'


function copyAndReplace(srcDir: string, destDir: string, replacements: Record<string, string>, overwrite = false) {
  if (!fs.existsSync(srcDir)) return
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true })
  for (const item of fs.readdirSync(srcDir)) {
    const srcPath = path.join(srcDir, item)
    const destPath = path.join(destDir, item)
    if (fs.statSync(srcPath).isDirectory()) {
      copyAndReplace(srcPath, destPath, replacements, overwrite)
    } else {
      let content = fs.readFileSync(srcPath, 'utf-8')
      for (const [from, to] of Object.entries(replacements)) {
        content = content.split(from).join(to)
      }
      if (!fs.existsSync(destPath) || overwrite) {
        fs.writeFileSync(destPath, content)
      }
    }
  }
}

export default async function generator(tree: Tree) {
  const directory = 'api/custom/plugins'
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
  const exportStatement = `export * from './libs/plugins/auth/auth.module'\n`
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
