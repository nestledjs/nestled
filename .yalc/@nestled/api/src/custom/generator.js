"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customGeneratorLogic = customGeneratorLogic;
exports.default = default_1;
const tslib_1 = require("tslib");
const devkit_1 = require("@nx/devkit");
const internals_1 = require("@prisma/internals");
const utils_1 = require("@nestled/utils");
const child_process_1 = require("child_process");
const get_npm_scope_1 = require("@nx/js/src/utils/package-json/get-npm-scope");
const pluralize_1 = tslib_1.__importDefault(require("pluralize"));
const path_1 = require("path");
// Group all dependencies into a single object
const defaultDependencies = {
    formatFiles: devkit_1.formatFiles,
    installPackagesTask: devkit_1.installPackagesTask,
    getDMMF: internals_1.getDMMF,
    addToModules: utils_1.addToModules,
    apiLibraryGenerator: utils_1.apiLibraryGenerator,
    getPrismaSchemaPath: utils_1.getPrismaSchemaPath,
    readPrismaSchema: utils_1.readPrismaSchema,
    execSync: child_process_1.execSync,
    getNpmScope: get_npm_scope_1.getNpmScope,
    pluralize: pluralize_1.default,
    join: path_1.join,
};
function getAllPrismaModels(tree, dependencies) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const prismaPath = dependencies.getPrismaSchemaPath(tree);
        const prismaSchema = dependencies.readPrismaSchema(tree, prismaPath);
        if (!prismaSchema) {
            console.error(`No Prisma schema found at ${prismaPath}`);
            return [];
        }
        try {
            const dmmf = yield dependencies.getDMMF({ datamodel: prismaSchema });
            return dmmf.datamodel.models.map((model) => {
                var _a;
                const singularPropertyName = model.name.charAt(0).toLowerCase() + model.name.slice(1);
                const pluralPropertyName = dependencies.pluralize(singularPropertyName);
                // Create a properly typed fields array
                const fields = model.fields.map((field) => (Object.assign({ name: field.name, type: field.type, isId: field.isId, isRequired: field.isRequired, isList: field.isList, isUnique: field.isUnique, isReadOnly: field.isReadOnly, isGenerated: field.isGenerated, isUpdatedAt: field.isUpdatedAt, documentation: field.documentation }, field)));
                // Create and return the model
                const modelData = {
                    name: model.name,
                    pluralName: dependencies.pluralize(model.name),
                    fields,
                    primaryField: ((_a = model.fields.find((f) => !f.isId && f.type === 'String')) === null || _a === void 0 ? void 0 : _a.name) || 'name',
                    modelName: model.name,
                    modelPropertyName: singularPropertyName,
                    pluralModelName: dependencies.pluralize(model.name),
                    pluralModelPropertyName: pluralPropertyName,
                };
                return modelData;
            });
        }
        catch (error) {
            console.error('Error parsing Prisma schema:', error);
            return [];
        }
    });
}
function ensureDirExists(tree, path) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (!tree.exists(path)) {
            // Only create the directory, do not write .gitkeep
            // Directory will be created when a file is written into it
        }
    });
}
function toKebabCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
        .toLowerCase();
}
function generateCustomFiles(tree, customLibraryRoot, models, npmScope, dependencies) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const defaultDir = dependencies.join(customLibraryRoot, 'src/lib/default');
        const pluginsDir = dependencies.join(customLibraryRoot, 'src/lib/plugins');
        yield ensureDirExists(tree, defaultDir);
        yield ensureDirExists(tree, pluginsDir);
        // Only write .gitkeep in pluginsDir
        tree.write(dependencies.join(pluginsDir, '.gitkeep'), '');
        for (const model of models) {
            const kebabModel = toKebabCase(model.modelName);
            const modelFolder = dependencies.join(defaultDir, kebabModel);
            if (tree.exists(modelFolder)) {
                // Skip if model folder already exists
                continue;
            }
            yield ensureDirExists(tree, modelFolder);
            // Generate service.ts
            const serviceContent = `import { Injectable } from '@nestjs/common'

@Injectable()
export class ${model.modelName}Service {
  // Empty for now; will override or extend later if needed
}
`;
            tree.write(dependencies.join(modelFolder, `${kebabModel}.service.ts`), serviceContent);
            // Generate resolver.ts
            const resolverContent = `
import { ApiCrudDataAccessService } from '${npmScope}/api/generated-crud/data-access'
import { Generated${model.modelName}Resolver } from '${npmScope}/api/generated-crud/feature'
import { Injectable } from '@nestjs/common'
import { Resolver } from '@nestjs/graphql'
import { ${model.modelName} } from '${npmScope}/api/core/models'

@Resolver(() => ${model.modelName})
@Injectable()
export class ${model.modelName}Resolver extends Generated${model.modelName}Resolver {
  constructor(
    // private readonly customService: ${model.modelName}Service,
    generatedService: ApiCrudDataAccessService,
  ) {
    super(generatedService)
  }
}
`;
            tree.write(dependencies.join(modelFolder, `${kebabModel}.resolver.ts`), resolverContent);
            // Generate module.ts
            const moduleContent = `import { Module } from '@nestjs/common'
import { ${model.modelName}Service } from './${kebabModel}.service'
import { ${model.modelName}Resolver } from './${kebabModel}.resolver'
import { ApiCrudDataAccessModule } from '${npmScope}/api/generated-crud/data-access'

@Module({
  imports: [ApiCrudDataAccessModule],
  providers: [${model.modelName}Service, ${model.modelName}Resolver],
  exports: [${model.modelName}Service, ${model.modelName}Resolver],
})
export class ${model.modelName}Module {}
`;
            tree.write(dependencies.join(modelFolder, `${kebabModel}.module.ts`), moduleContent);
            // Add to defaultModules in app.module.ts__tmpl__
            dependencies.addToModules({
                tree,
                modulePath: 'apps/api/src/app.module.ts',
                moduleArrayName: 'defaultModules',
                moduleToAdd: `${model.modelName}Module`,
                importPath: `${npmScope}/api/custom`,
            });
        }
        // Update index.ts to export all model modules
        const modelFolders = models.map((m) => toKebabCase(m.modelName));
        const indexContent = modelFolders.map((m) => `export * from './lib/default/${m}/${m}.module'`).join('\n');
        tree.write(dependencies.join(customLibraryRoot, 'src/index.ts'), indexContent);
    });
}
function customGeneratorLogic(tree_1, schema_1) {
    return tslib_1.__awaiter(this, arguments, void 0, function* (tree, schema, dependencies = defaultDependencies) {
        try {
            const name = schema.name || 'custom';
            const customLibraryRoot = schema.directory ? `libs/api/${schema.directory}/${name}` : `libs/api/${name}`;
            const projectName = schema.directory ? `api-${schema.directory.replace(/\//g, '-')}-${name}` : `api-${name}`;
            // Overwrite logic
            if (schema.overwrite && tree.exists(customLibraryRoot)) {
                try {
                    dependencies.execSync(`nx g @nx/workspace:remove ${projectName} --forceRemove`, {
                        stdio: 'inherit',
                        cwd: tree.root,
                    });
                }
                catch (error) {
                    console.warn(`Failed to remove existing library ${projectName}:`, error);
                }
            }
            // Use the shared apiLibraryGenerator
            yield dependencies.apiLibraryGenerator(tree, { name }, '', undefined, false);
            yield ensureDirExists(tree, dependencies.join(customLibraryRoot, 'src/lib/default'));
            yield ensureDirExists(tree, dependencies.join(customLibraryRoot, 'src/lib/plugins'));
            // Get all Prisma models
            const models = yield getAllPrismaModels(tree, dependencies);
            if (models.length === 0) {
                console.error('No Prisma models found');
                return;
            }
            // Generate custom files per model
            const npmScope = `@${dependencies.getNpmScope(tree)}`;
            yield generateCustomFiles(tree, customLibraryRoot, models, npmScope, dependencies);
            // Format files
            yield dependencies.formatFiles(tree);
            return () => {
                dependencies.installPackagesTask(tree);
            };
        }
        catch (error) {
            console.error('Error in Custom generator:', error);
            throw error;
        }
    });
}
function default_1(tree, schema) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return customGeneratorLogic(tree, schema);
    });
}
//# sourceMappingURL=generator.js.map