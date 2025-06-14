"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCrudLogic = generateCrudLogic;
exports.default = default_1;
const tslib_1 = require("tslib");
const devkit_1 = require("@nx/devkit");
const internals_1 = require("@prisma/internals");
const utils_1 = require("@nestled/utils");
const get_npm_scope_1 = require("@nx/js/src/utils/package-json/get-npm-scope");
// Group all dependencies into a single object
const defaultDependencies = {
    formatFiles: devkit_1.formatFiles,
    generateFiles: devkit_1.generateFiles,
    installPackagesTask: devkit_1.installPackagesTask,
    joinPathFragments: devkit_1.joinPathFragments,
    names: devkit_1.names,
    getDMMF: internals_1.getDMMF,
    apiLibraryGenerator: utils_1.apiLibraryGenerator,
    getPrismaSchemaPath: utils_1.getPrismaSchemaPath,
    readPrismaSchema: utils_1.readPrismaSchema,
    deleteFiles: utils_1.deleteFiles,
    getPluralName: utils_1.getPluralName,
    getNpmScope: get_npm_scope_1.getNpmScope,
};
function parseCrudAuth(comment) {
    try {
        // Match @crudAuth: { ... } in a single line
        const match = comment.match(/@crudAuth:\s*(\{.*\})/);
        if (!match)
            return null;
        // The captured group should be valid JSON
        return JSON.parse(match[1]);
    }
    catch (e) {
        console.error('Error parsing @crudAuth:', e);
        return null;
    }
}
function getCrudAuthForModel(schema, modelName) {
    const defaultConfig = {
        readOne: 'admin',
        readMany: 'admin',
        count: 'admin',
        create: 'admin',
        update: 'admin',
        delete: 'admin',
    };
    // Split the schema into lines for precise model matching
    const lines = schema.split('\n');
    let modelDoc = [];
    let foundModel = false;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Check if this is the start of our target model
        if (line.startsWith(`model ${modelName}`) ||
            line.startsWith(`model ${modelName} `) ||
            line.startsWith(`model ${modelName}{`)) {
            // We found our model, use the collected documentation
            foundModel = true;
            break;
        }
        else if (line.startsWith('model ')) {
            // Reset documentation when we hit a different model
            modelDoc = [];
        }
        else if (line.startsWith('///') && !foundModel) {
            // Only collect documentation if it's before our model
            modelDoc.push(line);
        }
    }
    if (!foundModel)
        return defaultConfig;
    // Find the @crudAuth line in the model's documentation
    const authLine = modelDoc.find((line) => line.includes('@crudAuth:'));
    if (!authLine)
        return defaultConfig;
    const config = parseCrudAuth(authLine);
    if (config) {
        return Object.assign(Object.assign({}, defaultConfig), config);
    }
    return defaultConfig;
}
function getGuardForAuthLevel(level) {
    if (!level)
        return 'GqlAuthAdminGuard'; // Default to admin if not specified
    level = level.toLowerCase();
    if (level === 'public')
        return null;
    if (level === 'user')
        return 'GqlAuthGuard';
    if (level === 'admin')
        return 'GqlAuthAdminGuard';
    // For custom roles, convert to PascalCase and prepend 'GqlAuth' and append 'Guard'
    // Example: 'custom' -> 'GqlAuthCustomGuard'
    const pascalCase = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
    return `GqlAuth${pascalCase}Guard`;
}
function getAllPrismaModels(tree, dependencies) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const prismaPath = dependencies.getPrismaSchemaPath(tree);
        if (!prismaPath || !tree.exists(prismaPath)) {
            console.error(`Prisma schema not found. Looked for ${prismaPath}`);
            return [];
        }
        const prismaSchema = dependencies.readPrismaSchema(tree, prismaPath);
        if (!prismaSchema) {
            console.error(`No Prisma schema found at ${prismaPath}`);
            return [];
        }
        try {
            const dmmf = yield dependencies.getDMMF({ datamodel: prismaSchema });
            return dmmf.datamodel.models
                .filter((model) => {
                if (!model.name || typeof model.name !== 'string' || !model.name.trim()) {
                    console.error('Skipping model with invalid or missing name:', model);
                    return false;
                }
                return true;
            })
                .map((model) => {
                var _a;
                const singularPropertyName = model.name.charAt(0).toLowerCase() + model.name.slice(1);
                const pluralName = dependencies.getPluralName(model.name);
                const pluralModelPropertyName = dependencies.getPluralName(singularPropertyName);
                // Create a properly typed fields array
                const fields = model.fields.map((field) => (Object.assign({ name: field.name, type: field.type, isId: field.isId, isRequired: field.isRequired, isList: field.isList, isUnique: field.isUnique, isReadOnly: field.isReadOnly, isGenerated: field.isGenerated, isUpdatedAt: field.isUpdatedAt, documentation: field.documentation }, field)));
                // Get auth config for this model
                const authConfig = getCrudAuthForModel(prismaSchema, model.name);
                // Create and return the model with auth configuration
                const modelWithAuth = {
                    name: model.name,
                    pluralName: pluralName,
                    fields,
                    primaryField: ((_a = model.fields.find((f) => !f.isId && f.type === 'String')) === null || _a === void 0 ? void 0 : _a.name) || 'name',
                    modelName: model.name,
                    modelPropertyName: singularPropertyName,
                    pluralModelName: pluralName,
                    pluralModelPropertyName: pluralModelPropertyName,
                    auth: authConfig,
                };
                return modelWithAuth;
            });
        }
        catch (error) {
            console.error('Error parsing Prisma schema:', error);
            return [];
        }
    });
}
function createLibraries(tree, name, models, dependencies) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // Create required libraries for CRUD
        // Define library names and roots
        const dataAccessLibraryRoot = `libs/api/generated-crud/data-access`;
        const featureLibraryRoot = `libs/api/generated-crud/feature`;
        const templatePath = dependencies.joinPathFragments(__dirname, './files');
        try {
            // Use the shared apiLibraryGenerator to create the data-access library with templates and models
            yield dependencies.apiLibraryGenerator(tree, { name, models }, templatePath, 'data-access');
            // Use the shared apiLibraryGenerator to create the feature library with an empty template directory
            yield dependencies.apiLibraryGenerator(tree, { name }, templatePath, 'feature');
        }
        catch (error) {
            console.error('Error creating libraries:', error);
            throw error;
        }
        return { dataAccessLibraryRoot, featureLibraryRoot };
    });
}
// Helper function to convert camelCase to kebab-case
function toKebabCase(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
function generateDataAccessFiles(tree, libraryRoot, models, schema, dependencies) {
    const npmScope = `@${dependencies.getNpmScope(tree)}`;
    const templateOptions = Object.assign(Object.assign({}, dependencies.names(schema.name || 'crud')), { models,
        npmScope, tmpl: '' });
    // Generate the shared data-access files
    dependencies.generateFiles(tree, dependencies.joinPathFragments(__dirname, './files/data-access/src/lib'), dependencies.joinPathFragments(libraryRoot, 'src/lib'), templateOptions);
    // Create the index file for the data-access library
    const indexPath = dependencies.joinPathFragments(libraryRoot, 'src/index.ts');
    const indexContent = `export * from './lib/api-crud-data-access.module';
export * from './lib/api-crud-data-access.service';
export * from './lib/dto';
`;
    tree.write(indexPath, indexContent);
}
function generateFeatureFiles(tree, libraryRoot, model, schema, dependencies) {
    var _a, _b, _c, _d, _e, _f;
    const npmScope = `@${dependencies.getNpmScope(tree)}`;
    const kebabCaseModelName = toKebabCase(model.name);
    const resolverPath = dependencies.joinPathFragments(libraryRoot, 'src/lib', `${kebabCaseModelName}.resolver.ts`);
    // The content for the resolver is generated dynamically.
    const resolverContent = `import { UseGuards } from '@nestjs/common'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { ApiCrudDataAccessService, PagingResponse } from '${npmScope}/api/generated-crud/data-access'
import { ${model.modelName} } from '${npmScope}/api/core/data-access'
import { GqlAuthAdminGuard, GqlAuthGuard } from '${npmScope}/api/auth/data-access'
import { Create${model.modelName}Input, Update${model.modelName}Input, List${model.modelName}Input } from './dto'

@Resolver()
export class ${model.modelName}Resolver {
  constructor(private readonly service: ApiCrudDataAccessService) {}

  @Query(() => [${model.modelName}], { nullable: true })
  @UseGuards(${((_a = model.auth) === null || _a === void 0 ? void 0 : _a.readMany) ? getGuardForAuthLevel(model.auth.readMany) : 'GqlAuthAdminGuard'})
  async ${model.pluralModelPropertyName}(@Args('input') input: List${model.modelName}Input) {
    return this.service.${model.pluralModelPropertyName}(input)
  }

  @Query(() => PagingResponse, { nullable: true })
  @UseGuards(${((_b = model.auth) === null || _b === void 0 ? void 0 : _b.count) ? getGuardForAuthLevel(model.auth.count) : 'GqlAuthAdminGuard'})
  async ${model.pluralModelPropertyName}Paging(@Args('input') input: List${model.modelName}Input) {
    return this.service.${model.pluralModelPropertyName}Paging(input)
  }

  @Query(() => ${model.modelName}, { nullable: true })
  @UseGuards(${((_c = model.auth) === null || _c === void 0 ? void 0 : _c.readOne) ? getGuardForAuthLevel(model.auth.readOne) : 'GqlAuthAdminGuard'})
  async ${model.modelPropertyName}(@Args('id') id: string) {
    return this.service.${model.modelPropertyName}(id)
  }

  @Mutation(() => ${model.modelName}, { nullable: true })
  @UseGuards(${((_d = model.auth) === null || _d === void 0 ? void 0 : _d.create) ? getGuardForAuthLevel(model.auth.create) : 'GqlAuthAdminGuard'})
  async create${model.modelName}(@Args('input') input: Create${model.modelName}Input) {
    return this.service.create${model.modelName}(input)
  }

  @Mutation(() => ${model.modelName}, { nullable: true })
  @UseGuards(${((_e = model.auth) === null || _e === void 0 ? void 0 : _e.update) ? getGuardForAuthLevel(model.auth.update) : 'GqlAuthAdminGuard'})
  async update${model.modelName}(@Args('id') id: string, @Args('input') input: Update${model.modelName}Input) {
    return this.service.update${model.modelName}(id, input)
  }

  @Mutation(() => ${model.modelName}, { nullable: true })
  @UseGuards(${((_f = model.auth) === null || _f === void 0 ? void 0 : _f.delete) ? getGuardForAuthLevel(model.auth.delete) : 'GqlAuthAdminGuard'})
  async delete${model.modelName}(@Args('id') id: string) {
    return this.service.delete${model.modelName}(id)
  }
}
`;
    // Write the dynamically generated resolver file.
    tree.write(resolverPath, resolverContent);
    // Update the index file for the feature library
    updateFeatureIndexFile(tree, libraryRoot, model.name, dependencies);
}
function updateFeatureIndexFile(tree, libraryRoot, modelName, dependencies) {
    const kebabCaseModelName = toKebabCase(modelName);
    const indexPath = dependencies.joinPathFragments(libraryRoot, 'src/index.ts');
    let indexContent = '';
    if (tree.exists(indexPath)) {
        indexContent = tree.read(indexPath, 'utf-8') || '';
    }
    const resolverExport = `export * from './lib/${kebabCaseModelName}.resolver';\n`;
    if (!indexContent.includes(resolverExport)) {
        indexContent += resolverExport;
    }
    tree.write(indexPath, indexContent);
}
function generateCrudLogic(tree_1, schema_1) {
    return tslib_1.__awaiter(this, arguments, void 0, function* (tree, schema, dependencies = defaultDependencies) {
        try {
            const name = schema.name || 'generated-crud';
            // Get all Prisma models
            const models = yield getAllPrismaModels(tree, dependencies);
            if (!models || models.length === 0) {
                console.error('No Prisma models found. Make sure your schema.prisma is correctly defined.');
                return;
            }
            // Create required libraries for CRUD
            const { dataAccessLibraryRoot, featureLibraryRoot } = yield createLibraries(tree, name, models, dependencies);
            // Overwrite logic for specific models
            if (schema.overwrite && schema.model) {
                const modelToDelete = schema.model;
                const modelObject = models.find((m) => m.name === modelToDelete);
                if (modelObject) {
                    const kebabCaseModelName = toKebabCase(modelObject.name);
                    const dataAccessPath = dependencies.joinPathFragments(dataAccessLibraryRoot, 'src/lib', `${kebabCaseModelName}.service.ts`);
                    const featurePath = dependencies.joinPathFragments(featureLibraryRoot, 'src/lib', `${kebabCaseModelName}.resolver.ts`);
                    dependencies.deleteFiles(tree, [dataAccessPath, featurePath]);
                }
            }
            // Generate shared data-access files
            generateDataAccessFiles(tree, dataAccessLibraryRoot, models, schema, dependencies);
            // Generate feature files for each model
            for (const model of models) {
                if (schema.model && model.name !== schema.model) {
                    continue;
                }
                generateFeatureFiles(tree, featureLibraryRoot, model, schema, dependencies);
            }
            // Format files
            yield dependencies.formatFiles(tree);
            return () => {
                dependencies.installPackagesTask(tree);
            };
        }
        catch (error) {
            console.error('Error in CRUD generator:', error);
            throw error;
        }
    });
}
function default_1(tree, schema) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return generateCrudLogic(tree, schema, defaultDependencies);
    });
}
//# sourceMappingURL=generator.js.map