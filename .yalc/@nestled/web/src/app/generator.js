"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const tslib_1 = require("tslib");
const devkit_1 = require("@nx/devkit");
const application_1 = require("@nx/react/src/generators/application/application");
const path = tslib_1.__importStar(require("path"));
const get_npm_scope_1 = require("@nx/js/src/utils/package-json/get-npm-scope");
function default_1(tree, schema) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            if (!tree.exists('apps')) {
                tree.write('apps/.gitkeep', '');
            }
            // Run the Nx generator command directly from the workspace root with a proper workspace layout
            yield (0, application_1.applicationGenerator)(tree, {
                name: 'web',
                directory: 'apps/web',
                bundler: 'vite',
                style: 'none',
                routing: true,
                useReactRouter: true,
                unitTestRunner: 'vitest',
                e2eTestRunner: 'none',
                linter: 'eslint',
            });
            // Wait a bit for files to be created
            // await new Promise((resolve) => setTimeout(resolve, 2000))
            // Delete the postcss.config.js file from the apps/web directory if it exists
            // const postcssConfigPath = path.join('apps', 'web', 'postcss.config.js')
            // if (tree.exists(postcssConfigPath)) {
            //   tree.delete(postcssConfigPath)
            // }
            // Delete the tailwind config file from the apps/web directory if it exists
            // const tailwindConfigJsPath = path.join('apps', 'web', 'tailwind.config.js')
            // const tailwindConfigTsPath = path.join('apps', 'web', 'tailwind.config.ts')
            // if (tree.exists(tailwindConfigJsPath)) {
            //   tree.delete(tailwindConfigJsPath)
            // }
            // if (tree.exists(tailwindConfigTsPath)) {
            //   tree.delete(tailwindConfigTsPath)
            // }
            // Add dev:web script to package.json
            (0, devkit_1.updateJson)(tree, 'package.json', (json) => {
                if (!json.scripts) {
                    json.scripts = {};
                }
                json.scripts['dev:web'] = 'nx serve web';
                return json;
            });
            // Generate custom files
            const targetPath = path.join('apps', 'web');
            if (tree.exists(targetPath)) {
                (0, devkit_1.generateFiles)(tree, (0, devkit_1.joinPathFragments)(__dirname, './files'), targetPath, Object.assign(Object.assign({}, schema), { tmpl: '', npmScope: (0, get_npm_scope_1.getNpmScope)(tree) }));
                // Delete the unused default app files
                // const filesToDelete = [path.join(targetPath, 'assets'), path.join(targetPath, 'app')]
                // filesToDelete.forEach((filePath) => {
                //   if (tree.exists(filePath)) {
                //     tree.delete(filePath)
                //   }
                // })
                // Overwrite vite.config.ts in the apps/web directory with the custom template
                // const viteConfigPath = path.join('apps', 'web', 'vite.config.ts')
                // generateFiles(tree, joinPathFragments(__dirname, './files'), 'apps/web', { ...schema, tmpl: '' })
            }
            else {
                console.error(`Target path ${targetPath} does not exist after generation`);
            }
        }
        catch (error) {
            console.error('Error generating Web app:', error);
            throw error;
        }
    });
}
//# sourceMappingURL=generator.js.map