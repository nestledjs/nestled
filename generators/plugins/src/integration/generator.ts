import { formatFiles, generateFiles, joinPathFragments, Tree } from '@nx/devkit'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'

interface Schema {
  name: 'smtp-mailer'; // Only 'smtp-mailer' is allowed for now
}

export default async function generator(tree: Tree, schema: Schema) {
  const { name } = schema;
  if (name !== 'smtp-mailer') {
    throw new Error("Currently, only 'smtp-mailer' is supported as an integration name.");
  }
  const directory = 'api/integrations/src/lib';
  const destRoot = joinPathFragments('libs', directory, name);
  const templateSource = joinPathFragments(__dirname, 'files', name);

  generateFiles(tree, templateSource, destRoot, {
    tmpl: '',
    name,
  });

  // Add exports to /libs/api/integrations/src/lib/index.ts
  const indexPath = 'libs/api/integrations/src/lib/index.ts';
  const exportPaths = [
    `./${name}/${name}.service`,
    `./${name}/${name}.module`
  ];
  let content = '';
  if (tree.exists(indexPath)) {
    content = tree.read(indexPath, 'utf-8');
  }
  let updated = false;
  for (const path of exportPaths) {
    const exportStatement = `export * from '${path}';\n`;
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
