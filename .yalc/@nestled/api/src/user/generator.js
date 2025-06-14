"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = generateLibraries;
const tslib_1 = require("tslib");
const devkit_1 = require("@nx/devkit");
const utils_1 = require("@nestled/utils");
function generateLibraries(tree) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const templateRootPath = (0, devkit_1.joinPathFragments)(__dirname, './files');
        yield (0, utils_1.apiLibraryGenerator)(tree, { name: 'user' }, templateRootPath, 'data-access');
        yield (0, utils_1.apiLibraryGenerator)(tree, { name: 'user' }, templateRootPath, 'feature', true);
        yield (0, devkit_1.formatFiles)(tree);
        return () => {
            (0, devkit_1.installPackagesTask)(tree);
        };
    });
}
//# sourceMappingURL=generator.js.map