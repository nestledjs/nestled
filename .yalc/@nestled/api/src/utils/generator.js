"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = generator;
const tslib_1 = require("tslib");
const devkit_1 = require("@nx/devkit");
const utils_1 = require("@nestled/utils");
function generator(tree) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const templateRootPath = (0, devkit_1.joinPathFragments)(__dirname, './files');
        const overwrite = false;
        yield (0, utils_1.apiLibraryGenerator)(tree, { name: 'utils', overwrite }, templateRootPath, '', false);
        // Remove the default module file if it exists
        (0, utils_1.deleteFiles)(tree, ['libs/api/utils/src/lib/api-utils.module.ts']);
        yield (0, devkit_1.formatFiles)(tree);
    });
}
//# sourceMappingURL=generator.js.map