"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = generateLibraries;
const tslib_1 = require("tslib");
const devkit_1 = require("@nx/devkit");
const utils_1 = require("@nestled/utils");
function generateLibraries(tree_1) {
    return tslib_1.__awaiter(this, arguments, void 0, function* (tree, options = {}) {
        const templateRootPath = (0, devkit_1.joinPathFragments)(__dirname, './files');
        const overwrite = options.overwrite === true;
        yield (0, utils_1.apiLibraryGenerator)(tree, { name: 'config', overwrite }, templateRootPath);
        yield (0, devkit_1.formatFiles)(tree);
        return () => {
            (0, devkit_1.installPackagesTask)(tree);
        };
    });
}
//# sourceMappingURL=generator.js.map