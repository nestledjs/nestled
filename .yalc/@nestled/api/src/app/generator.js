"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const tslib_1 = require("tslib");
const devkit_1 = require("@nx/devkit");
const child_process_1 = require("child_process");
const path = tslib_1.__importStar(require("path"));
const get_npm_scope_1 = require("@nx/js/src/utils/package-json/get-npm-scope");
/**
 * Removes specific compiler options from tsconfig.app.json to use the settings from tsconfig.base.json
 * @param tree The file system tree
 */
function updateAppTsConfig(tree) {
    const tsConfigPath = 'apps/api/tsconfig.app.json';
    if (tree.exists(tsConfigPath)) {
        (0, devkit_1.updateJson)(tree, tsConfigPath, (json) => {
            if (json.compilerOptions) {
                // Remove specific options to use the ones from tsconfig.base.json
                delete json.compilerOptions.module;
                delete json.compilerOptions.moduleResolution;
                delete json.compilerOptions.emitDecoratorMetadata;
                delete json.compilerOptions.experimentalDecorators;
            }
            return json;
        });
    }
    else {
        console.warn(`tsconfig.app.json not found at: ${tsConfigPath}`);
    }
}
function default_1(tree, schema) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            // Get the workspace root directory
            const workspaceRoot = tree.root;
            // Create apps directory if it doesn't exist
            if (!tree.exists('apps')) {
                tree.write('apps/.gitkeep', '');
            }
            // Run the Nx generator command directly from the workspace root with proper workspace layout
            (0, child_process_1.execSync)('nx g @nx/nest:application --name api --directory apps/api --no-interactive', {
                stdio: 'inherit',
                cwd: workspaceRoot,
            });
            // Wait a bit for files to be created
            yield new Promise((resolve) => setTimeout(resolve, 2000));
            // Update tsconfig.app.json to remove specific compiler options
            updateAppTsConfig(tree);
            // Generate all files according to the template folder structure
            (0, devkit_1.generateFiles)(tree, (0, devkit_1.joinPathFragments)(__dirname, './files'), path.join('apps', 'api'), Object.assign(Object.assign({}, schema), { tmpl: '', npmScope: (0, get_npm_scope_1.getNpmScope)(tree) }));
            // Add dev:api script to package.json
            (0, devkit_1.updateJson)(tree, 'package.json', (json) => {
                if (!json.scripts) {
                    json.scripts = {};
                }
                json.scripts['dev:api'] = 'nx serve api --skip-nx-cache';
                return json;
            });
            // Update the build target in apps/api/project.json to use custom webpack command
            const projectJsonPath = path.join('apps', 'api', 'project.json');
            if (tree.exists(projectJsonPath)) {
                (0, devkit_1.updateJson)(tree, projectJsonPath, (json) => {
                    json.targets = json.targets || {};
                    json.targets.build = {
                        executor: 'nx:run-commands',
                        options: {
                            command: 'NODE_ENV=production webpack-cli --config apps/api/webpack.config.js',
                        },
                        configurations: {
                            development: {
                                command: 'NODE_ENV=development webpack-cli --config apps/api/webpack.config.js',
                            },
                        },
                    };
                    return json;
                });
            }
            else {
                console.warn(`project.json not found at: ${projectJsonPath}`);
            }
            // Optionally, delete the unused default app files if they exist
            const targetPath = path.join('apps', 'api', 'src');
            const filesToDelete = [path.join(targetPath, 'assets'), path.join(targetPath, 'app')];
            filesToDelete.forEach((filePath) => {
                if (tree.exists(filePath)) {
                    tree.delete(filePath);
                }
            });
        }
        catch (error) {
            console.error('Error generating API app:', error);
            throw error;
        }
    });
}
//# sourceMappingURL=generator.js.map