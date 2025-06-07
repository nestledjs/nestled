import { formatFiles, generateFiles, installPackagesTask, joinPathFragments, names, Tree } from '@nx/devkit'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'

function addNavigation(tree, options) {
  const routerPath = `apps/web/app/routes/admin.tsx`

  if (!tree.exists(routerPath)) {
    console.error(`Can't find ${routerPath}`)
    return
  }

  const routerContents = tree.read(routerPath)?.toString()
  if (routerContents) {
    const navEndpoint = '// Add New Nav Objects Here'
    const newNav = `{
      name: '${options.pluralClassName}',
      href: '/admin/${options.pluralName}',
      icon: HomeIcon,
      current: currentPath.toLowerCase().includes('admin/${options.pluralName}'),
    },`

    const updatedContents = routerContents.replace(navEndpoint, [newNav, navEndpoint].join('\n'))
    tree.overwrite(routerPath, updatedContents)
  }
}

function addFieldType(tree, options: Record<string, unknown>, schema: Record<string, unknown>) {
  console.log('Started Adding Field Type')

  let _a

  const routerPath = `libs/shared/fields/src/lib/shared-fields.tsx`
  if (!tree.exists(routerPath)) {
    console.error(`Can't find ${routerPath}`)
  } else {
    console.info(`Found ${routerPath}`)
  }
  const contents = (_a = tree.read(routerPath)) === null || _a === void 0 ? void 0 : _a.toString()
  if (contents) {
    const navEndpoint = '// Add New Admin Field Definitions Here'
    const newNav = `export const admin${options.className}Fields: WebUiFormField[] = [
  WebUiFormField.input('${schema.primaryField}', { label: '${schema.primaryField}' }),
]`

    const replacedModule = contents.replace(navEndpoint, [newNav, navEndpoint].join('\n'))

    tree.overwrite(routerPath, replacedModule)
  }
}

export default async function (tree: Tree, schema: any) {
  const npmScope = `@${getNpmScope(tree)}`
  const pluralName = schema.plural || `${schema.name}s`
  const pluralNames = names(pluralName)
  const variables = {
    ...schema,
    ...names(schema.name),
    pluralName: pluralNames.name,
    pluralClassName: pluralNames.className,
    pluralPropertyName: pluralNames.propertyName,
    npmScope,
    tmpl: '',
  }
  generateFiles(
    tree, // the virtual file system
    joinPathFragments(__dirname, `./app-pages`), // path to the file templates
    `apps/web/app/routes`, // destination path of the files
    variables, // config object to replace variable in file templates
  )
  generateFiles(
    tree, // the virtual file system
    joinPathFragments(__dirname, `./admin-sdk-files`), // path to the file templates
    `libs/shared/util-sdk/src/graphql/admin/${schema.name}`, // destination path of the files
    variables, // config object to replace variable in file templates
  )
  // generateFiles(
  //   tree, // the virtual file system
  //   joinPathFragments(__dirname, `./user-sdk-files`), // path to the file templates
  //   `libs/shared/util-sdk/src/graphql/${schema.name}`, // destination path of the files
  //   variables, // config object to replace variable in file templates
  // )

  addNavigation(tree, variables)
  addFieldType(tree, variables, schema)
  await formatFiles(tree)
  return () => {
    installPackagesTask(tree)
    console.warn(`Restart the API and Web Server to see changes`)
  }
}
