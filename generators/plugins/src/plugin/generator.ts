import { formatFiles, generateFiles, joinPathFragments, Tree } from '@nx/devkit'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'
import { addToModules } from '@nestledjs/utils'

interface Schema {
  name: 'auth'; // Only 'auth' is allowed for now
}

export default async function generator(tree: Tree, schema: Schema) {
  const { name } = schema;
  if (name !== 'auth') {
    throw new Error("Currently, only 'auth' is supported as a plugin name.");
  }
  const directory = 'api/custom/src/lib/plugins';
  const npmScope = getNpmScope(tree);
  const destRoot = joinPathFragments('libs', directory, name);
  const templateSource = joinPathFragments(__dirname, 'files', name);

  generateFiles(tree, templateSource, destRoot, {
    tmpl: '',
    npmScope,
    name,
  });

  addToModules({
    tree,
    modulePath: 'apps/api/src/app.module.ts',
    moduleArrayName: 'pluginModules',
    moduleToAdd: `${capitalize(name)}Module`,
    importPath: `@${npmScope}/api/custom`,
  });

  // Add exports to /libs/api/custom/src/index.ts
  const indexPath = 'libs/api/custom/src/index.ts';
  const exportPaths = [`./lib/plugins/${name}/${name}.module`];
  let content = '';
  if (tree.exists(indexPath)) {
    content = tree.read(indexPath, 'utf-8');
  }
  let updated = false;
  for (const path of exportPaths) {
    const exportStatement = `export * from '${path}'\n`;
    if (!content.includes(exportStatement.trim())) {
      content += (content.endsWith('\n') ? '' : '\n') + exportStatement;
      updated = true;
    }
  }
  if (updated || !tree.exists(indexPath)) {
    tree.write(indexPath, content);
  }

  await formatFiles(tree);
}

function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
