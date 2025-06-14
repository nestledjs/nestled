"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const tslib_1 = require("tslib");
const devkit_1 = require("@nx/devkit");
const path_1 = require("path");
function toKebabCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
        .toLowerCase();
}
function toPascalCase(str) {
    return str
        .replace(/(^\w|[-_\s]\w)/g, (match) => match.replace(/[-_\s]/, '').toUpperCase());
}
function ensureDirExists(tree, path) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!tree.exists(path)) {
            // Directory will be created when a file is written into it
        }
    });
}
function default_1(tree, schema) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const name = schema.name;
        if (!name)
            throw new Error('Name is required');
        const kebabName = toKebabCase(name);
        const className = toPascalCase(name);
        const customLibraryRoot = schema.directory ? `libs/api/${schema.directory}/custom` : `libs/api/custom`;
        const pluginsDir = (0, path_1.join)(customLibraryRoot, 'src/lib/plugins');
        const pluginFolder = (0, path_1.join)(pluginsDir, kebabName);
        yield ensureDirExists(tree, pluginsDir);
        yield ensureDirExists(tree, pluginFolder);
        // Service
        const serviceContent = `import { Injectable } from '@nestjs/common'

@Injectable()
export class ${className}Service {
  // Add your service logic here
}
`;
        tree.write((0, path_1.join)(pluginFolder, `${kebabName}.service.ts`), serviceContent);
        // Resolver
        const resolverContent = `import { Resolver } from '@nestjs/graphql'
import { Injectable } from '@nestjs/common'

@Resolver()
@Injectable()
export class ${className}Resolver {
  // Add your resolver logic here
}
`;
        tree.write((0, path_1.join)(pluginFolder, `${kebabName}.resolver.ts`), resolverContent);
        // Module
        const moduleContent = `import { Module } from '@nestjs/common'
import { ${className}Service } from './${kebabName}.service'
import { ${className}Resolver } from './${kebabName}.resolver'

@Module({
  providers: [${className}Service, ${className}Resolver],
  exports: [${className}Service, ${className}Resolver],
})
export class ${className}Module {}
`;
        tree.write((0, path_1.join)(pluginFolder, `${kebabName}.module.ts`), moduleContent);
        yield (0, devkit_1.formatFiles)(tree);
        return () => {
            (0, devkit_1.installPackagesTask)(tree);
        };
    });
}
//# sourceMappingURL=generator.js.map