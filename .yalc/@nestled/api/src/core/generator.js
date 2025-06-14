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
        const dependencies = {
            'graphql-type-json': '^0.3.2',
            '@nestjs/graphql': '^12.0.0',
            '@nestjs/common': '^10.0.0',
            '@nestjs/passport': '^10.0.0',
            '@nestjs/axios': '^3.0.0',
            '@prisma/client': '^6.9.0',
            '@apollo/server': '^4.9.0',
        };
        const devDependencies = {};
        yield (0, utils_1.installPlugins)(tree, dependencies, devDependencies);
        yield (0, utils_1.apiLibraryGenerator)(tree, { name: 'core', overwrite }, templateRootPath, 'data-access');
        yield (0, utils_1.apiLibraryGenerator)(tree, { name: 'core', overwrite }, templateRootPath, 'feature', true);
        yield (0, utils_1.apiLibraryGenerator)(tree, { name: 'core', overwrite }, templateRootPath, 'models');
        yield (0, devkit_1.formatFiles)(tree);
        return () => {
            (0, devkit_1.installPackagesTask)(tree);
        };
    });
}
//# sourceMappingURL=generator.js.map