import {
  formatFiles,
  generateFiles,
  installPackagesTask,
  joinPathFragments,
  names,
  readJson,
  readProjectConfiguration,
  Tree,
} from '@nx/devkit'
import { WebUserCrudGeneratorSchema } from './schema'
import { libraryGenerator } from '@nx/react'
import { Linter } from '@nx/eslint'

function addNavigation(tree, options) {
  console.log('Started Adding Navigation')

  let _a

  const routerPath = `libs/web/router/src/lib/web-router.tsx`
  if (!tree.exists(routerPath)) {
    console.error(`Can't find ${routerPath}`)
  }
  console.info(`Found ${routerPath}`)
  const contents = (_a = tree.read(routerPath)) === null || _a === void 0 ? void 0 : _a.toString()
  if (contents) {
    const importEndpoint = '// Add New Imports Here'
    const newImports = `import { Web${options.className}Create, Web${options.className}List, Web${options.className}Update } from '@${options.npmScope}/web/${options.name}'`
    const navEndpoint = '// Add New Nav Objects Here'
    const newNav = `{
      name: '${options.pluralClassName}',
      href: '/${options.pluralName}',
      icon: HomeIcon,
      current: currentPath.path.includes('/${options.pluralName}'),
    },`
    const routeEndpoint = `{/*Add New Routes Here*/}`
    const newRoute = `<Route path="${options.pluralName}" element={<Web${options.className}List />} />
        <Route path="${options.name}">
          <Route path="new" element={<Web${options.className}Create />} />
          <Route path=":id" element={<Web${options.className}Update />} />
        </Route>`

    const replacedModule = contents
      .replace(importEndpoint, [newImports, importEndpoint].join('\n'))
      .replace(navEndpoint, [newNav, navEndpoint].join('\n'))
      .replace(routeEndpoint, [newRoute, routeEndpoint].join('\n'))

    tree.overwrite(routerPath, replacedModule)
  }
}
export default async function (tree: Tree, options: WebUserCrudGeneratorSchema) {
  await libraryGenerator(tree, {
    name: options.name,
    directory: 'web',
    style: 'none',
    skipTsConfig: false,
    skipFormat: false,
    unitTestRunner: 'jest',
    linter: Linter.EsLint,
  })
  const libraryRoot = readProjectConfiguration(tree, `web-${options.name}`).root

  const npmScope = readJson(tree, 'nx.json').npmScope
  const pluralName = options.plural || `${options.name}s`
  const pluralNames = names(pluralName)
  const variables = {
    ...options,
    ...names(options.name),
    pluralName: pluralNames.name,
    pluralClassName: pluralNames.className,
    pluralPropertyName: pluralNames.propertyName,
    npmScope,
    tmpl: '',
  }
  generateFiles(
    tree, // the virtual file system
    joinPathFragments(__dirname, `./files`), // path to the file templates
    libraryRoot, // destination path of the files
    variables, // config object to replace variable in file templates
  )
  generateFiles(
    tree, // the virtual file systemf
    joinPathFragments(__dirname, `./sdk-files`), // path to the file templates
    `libs/shared/util-sdk/src/graphql/${options.name}`, // destination path of the files
    variables, // config object to replace variable in file templates
  )

  addNavigation(tree, variables)
  await formatFiles(tree)
  return () => {
    installPackagesTask(tree)
    console.warn(`Restart the API and Web Server to see changes`)
  }
}
