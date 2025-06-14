"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
const tslib_1 = require("tslib");
const devkit_1 = require("@nx/devkit");
const internals_1 = require("@prisma/internals");
const utils_1 = require("@nestled/utils");
const get_npm_scope_1 = require("@nx/js/src/utils/package-json/get-npm-scope");
const pluralize_1 = tslib_1.__importDefault(require("pluralize"));
const path_1 = require("path");
function toKebabCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
        .toLowerCase();
}
function getAllPrismaModels(tree) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const prismaPath = (0, utils_1.getPrismaSchemaPath)(tree);
        const prismaSchema = (0, utils_1.readPrismaSchema)(tree, prismaPath);
        if (!prismaSchema) {
            console.error(`No Prisma schema found at ${prismaPath}`);
            return [];
        }
        try {
            const dmmf = yield (0, internals_1.getDMMF)({ datamodel: prismaSchema });
            return dmmf.datamodel.models.map((model) => {
                var _a;
                const singularPropertyName = model.name.charAt(0).toLowerCase() + model.name.slice(1);
                const pluralPropertyName = (0, pluralize_1.default)(singularPropertyName);
                const fields = model.fields.map((field) => (Object.assign({ name: field.name, type: field.type, isId: field.isId, isRequired: field.isRequired, isList: field.isList, isUnique: field.isUnique, isReadOnly: field.isReadOnly, isGenerated: field.isGenerated, isUpdatedAt: field.isUpdatedAt, documentation: field.documentation }, field)));
                return {
                    name: model.name,
                    pluralName: (0, pluralize_1.default)(model.name),
                    fields,
                    primaryField: ((_a = model.fields.find((f) => !f.isId && f.type === 'String')) === null || _a === void 0 ? void 0 : _a.name) || 'name',
                    modelName: model.name,
                    modelPropertyName: singularPropertyName,
                    pluralModelName: (0, pluralize_1.default)(model.name),
                    pluralModelPropertyName: pluralPropertyName,
                };
            });
        }
        catch (error) {
            console.error('Error parsing Prisma schema:', error);
            return [];
        }
    });
}
function generateModelLibrary(tree, model, npmScope, overwrite) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const kebabModel = toKebabCase(model.modelName);
        const libName = kebabModel;
        const libRoot = `libs/api/extended/${libName}`;
        // Create the Nx library for this model
        yield (0, utils_1.apiLibraryGenerator)(tree, { name: `extended-${libName}`, overwrite }, '', undefined, false);
        // Generate service.ts
        const serviceContent = `import { Injectable } from '@nestjs/common'

@Injectable()
export class ${model.modelName}Service {
  // Empty for now; will override or extend later if needed
}
`;
        tree.write((0, path_1.join)(libRoot, 'src/lib', `${kebabModel}.service.ts`), serviceContent);
        // Generate resolver.ts
        const resolverContent = `import { ${model.modelName}Service } from './${kebabModel}.service'
import { ApiCrudDataAccessService } from '${npmScope}/api/generated-crud/data-access'
import { Generated${model.modelName}Resolver } from '${npmScope}/api/generated-crud/feature'
import { Injectable } from '@nestjs/common'
import { Resolver } from '@nestjs/graphql'
import { ${model.modelName} } from '${npmScope}/api/core/models'

@Resolver(() => ${model.modelName})
@Injectable()
export class ${model.modelName}Resolver extends Generated${model.modelName}Resolver {
  constructor(
    private readonly customService: ${model.modelName}Service,
    private readonly generatedService: ApiCrudDataAccessService,
  ) {
    super(generatedService)
  }
}
`;
        tree.write((0, path_1.join)(libRoot, 'src/lib', `${kebabModel}.resolver.ts`), resolverContent);
        // Generate module.ts
        const moduleContent = `import { Module } from '@nestjs/common'
import { ${model.modelName}Service } from './${kebabModel}.service'
import { ${model.modelName}Resolver } from './${kebabModel}.resolver'

@Module({
  providers: [${model.modelName}Service, ${model.modelName}Resolver],
  exports: [${model.modelName}Service, ${model.modelName}Resolver],
})
export class ${model.modelName}Module {}
`;
        tree.write((0, path_1.join)(libRoot, 'src/lib', `${kebabModel}.module.ts`), moduleContent);
        // Update index.ts to export the module
        const indexContent = `export * from './lib/${kebabModel}.module'`;
        tree.write((0, path_1.join)(libRoot, 'src/index.ts'), indexContent);
        // Optionally, add to app.module.ts or other registration logic here
        // addToModules({ ... })
    });
}
function default_1(tree, schema) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        try {
            // Ensure the extended folder exists (not an Nx project)
            const extendedRoot = 'libs/api/extended';
            if (!tree.exists(extendedRoot)) {
                tree.write((0, path_1.join)(extendedRoot, '.gitkeep'), '');
            }
            // Get all Prisma models
            const models = yield getAllPrismaModels(tree);
            if (models.length === 0) {
                console.error('No Prisma models found');
                return;
            }
            const npmScope = `@${(0, get_npm_scope_1.getNpmScope)(tree)}`;
            const overwrite = !!schema.overwrite;
            // For each model, generate a library and custom files
            for (const model of models) {
                yield generateModelLibrary(tree, model, npmScope, overwrite);
            }
            yield (0, devkit_1.formatFiles)(tree);
            return () => {
                (0, devkit_1.installPackagesTask)(tree);
            };
        }
        catch (error) {
            console.error('Error in Extended generator:', error);
            throw error;
        }
    });
}
//# sourceMappingURL=generator.js.map