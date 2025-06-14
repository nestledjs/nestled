"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = generator;
const tslib_1 = require("tslib");
const devkit_1 = require("@nx/devkit");
const get_npm_scope_1 = require("@nx/js/src/utils/package-json/get-npm-scope");
const utils_1 = require("@nestled/utils");
function generator(tree) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const directory = 'api/custom/src/lib/plugins';
        const overwrite = false;
        const npmScope = (0, get_npm_scope_1.getNpmScope)(tree);
        const destRoot = (0, devkit_1.joinPathFragments)('libs', directory, 'auth');
        const templateSource = (0, devkit_1.joinPathFragments)(__dirname, 'files');
        (0, devkit_1.generateFiles)(tree, templateSource, destRoot, {
            tmpl: '',
            npmScope,
            overwrite,
        });
        (0, utils_1.addToModules)({
            tree,
            modulePath: 'apps/api/src/app.module.ts',
            moduleArrayName: 'pluginModules',
            moduleToAdd: 'AuthModule',
            importPath: `@${npmScope}/api/custom`,
        });
        // Add exports to /libs/api/custom/src/index.ts
        const indexPath = 'libs/api/custom/src/index.ts';
        const exportPaths = ['./lib/plugins/auth/auth.module'];
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
        yield (0, devkit_1.formatFiles)(tree);
    });
}
//# sourceMappingURL=generator.js.map