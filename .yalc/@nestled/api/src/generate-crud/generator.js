"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCrudAuth = parseCrudAuth;
exports.getCrudAuthForModel = getCrudAuthForModel;
exports.getGuardForAuthLevel = getGuardForAuthLevel;
exports.generateResolverContent = generateResolverContent;
exports.generateFeatureModuleContent = generateFeatureModuleContent;
exports.generateFeatureIndexContent = generateFeatureIndexContent;
exports.generateCrudLogic = generateCrudLogic;
exports.default = default_1;
const tslib_1 = require("tslib");
const devkit_1 = require("@nx/devkit");
const internals_1 = require("@prisma/internals");
const utils_1 = require("@nestled/utils");
const get_npm_scope_1 = require("@nx/js/src/utils/package-json/get-npm-scope");
const pluralize_1 = tslib_1.__importDefault(require("pluralize"));
// STEP 2: DEFINE PURE HELPER & CONTENT GENERATION FUNCTIONS
// These functions are side-effect free and can be tested independently.
function parseCrudAuth(comment) {
    try {
        const match = comment.match(/@crudAuth:\s*(\{.*\})/);
        if (!match)
            return null;
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
    const lines = schema.split('\n');
    let modelDoc = [];
    let foundModel = false;
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith(`model ${modelName}`) ||
            trimmedLine.startsWith(`model ${modelName} `) ||
            trimmedLine.startsWith(`model ${modelName}{`)) {
            foundModel = true;
            break;
        }
        else if (trimmedLine.startsWith('model ')) {
            modelDoc = [];
        }
        else if (trimmedLine.startsWith('///') && !foundModel) {
            modelDoc.push(trimmedLine);
        }
    }
    if (!foundModel)
        return defaultConfig;
    const authLine = modelDoc.find((line) => line.includes('@crudAuth:'));
    if (!authLine)
        return defaultConfig;
    const config = parseCrudAuth(authLine);
    return config ? Object.assign(Object.assign({}, defaultConfig), config) : defaultConfig;
}
function getGuardForAuthLevel(level) {
    if (!level)
        return 'GqlAuthAdminGuard';
    level = level.toLowerCase();
    if (level === 'public')
        return null;
    if (level === 'user')
        return 'GqlAuthGuard';
    if (level === 'admin')
        return 'GqlAuthAdminGuard';
    const pascalCase = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
    return `GqlAuth${pascalCase}Guard`;
}
function toKebabCase(str) {
    return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}
function generateResolverContent(model, npmScope) {
    var _a, _b, _c, _d, _e, _f;
    const usedGuards = new Set();
    if (model.auth) {
        Object.values(model.auth).forEach((level) => {
            if (level === 'public')
                return;
            const guard = getGuardForAuthLevel(level);
            if (guard)
                usedGuards.add(guard);
        });
    }
    else {
        usedGuards.add('GqlAuthAdminGuard');
    }
    const guardImports = usedGuards.size > 0 ? `import { ${Array.from(usedGuards).sort().join(', ')} } from '@${npmScope}/api/utils'` : '';
    const readManyGuardDecorator = ((_a = model.auth) === null || _a === void 0 ? void 0 : _a.readMany) ? getGuardForAuthLevel(model.auth.readMany) : 'GqlAuthAdminGuard';
    const countGuardDecorator = ((_b = model.auth) === null || _b === void 0 ? void 0 : _b.count) ? getGuardForAuthLevel(model.auth.count) : 'GqlAuthAdminGuard';
    const readOneGuardDecorator = ((_c = model.auth) === null || _c === void 0 ? void 0 : _c.readOne) ? getGuardForAuthLevel(model.auth.readOne) : 'GqlAuthAdminGuard';
    const createGuardDecorator = ((_d = model.auth) === null || _d === void 0 ? void 0 : _d.create) ? getGuardForAuthLevel(model.auth.create) : 'GqlAuthAdminGuard';
    const updateGuardDecorator = ((_e = model.auth) === null || _e === void 0 ? void 0 : _e.update) ? getGuardForAuthLevel(model.auth.update) : 'GqlAuthAdminGuard';
    const deleteGuardDecorator = ((_f = model.auth) === null || _f === void 0 ? void 0 : _f.delete) ? getGuardForAuthLevel(model.auth.delete) : 'GqlAuthAdminGuard';
    const readManyMethodName = model.pluralModelPropertyName;
    const countMethodName = `${model.pluralModelPropertyName}Count`;
    const readOneMethodName = model.modelPropertyName;
    return `import { Args, Mutation, Query, Resolver, Info } from '@nestjs/graphql'
import { UseGuards } from '@nestjs/common'
import type { GraphQLResolveInfo } from 'graphql'
import { CorePaging } from '@${npmScope}/api/core/data-access'
import { ApiCrudDataAccessService } from '@${npmScope}/api/generated-crud/data-access'
import { ${model.modelName} } from '@${npmScope}/api/core/models'
import { Create${model.modelName}Input, List${model.modelName}Input, Update${model.modelName}Input } from '@${npmScope}/api/generated-crud/data-access'
${guardImports}

@Resolver(() => ${model.modelName})
export class Generated${model.modelName}Resolver {
  constructor(private readonly service: ApiCrudDataAccessService) {}

  @Query(() => [${model.modelName}], { nullable: true })
  ${readManyGuardDecorator ? `@UseGuards(${readManyGuardDecorator})` : ''}
  ${readManyMethodName}(
    @Info() info: GraphQLResolveInfo,
    @Args({ name: 'input', type: () => List${model.modelName}Input, nullable: true }) input?: List${model.modelName}Input,
  ) {
    return this.service.${readManyMethodName}(info, input)
  }

  @Query(() => CorePaging, { nullable: true })
  ${countGuardDecorator ? `@UseGuards(${countGuardDecorator})` : ''}
  ${countMethodName}(
    @Args({ name: 'input', type: () => List${model.modelName}Input, nullable: true }) input?: List${model.modelName}Input,
  ) {
    return this.service.${countMethodName}(input)
  }

  @Query(() => ${model.modelName}, { nullable: true })
  ${readOneGuardDecorator ? `@UseGuards(${readOneGuardDecorator})` : ''}
  ${readOneMethodName}(
    @Info() info: GraphQLResolveInfo,
    @Args('${model.modelPropertyName}Id') ${model.modelPropertyName}Id: string
  ) {
    return this.service.${readOneMethodName}(info, ${model.modelPropertyName}Id)
  }

  @Mutation(() => ${model.modelName}, { nullable: true })
  ${createGuardDecorator ? `@UseGuards(${createGuardDecorator})` : ''}
  create${model.modelName}(
    @Info() info: GraphQLResolveInfo,
    @Args('input') input: Create${model.modelName}Input,
  ) {
    return this.service.create${model.modelName}(info, input)
  }

  @Mutation(() => ${model.modelName}, { nullable: true })
  ${updateGuardDecorator ? `@UseGuards(${updateGuardDecorator})` : ''}
  update${model.modelName}(
    @Info() info: GraphQLResolveInfo,
    @Args('${model.modelPropertyName}Id') ${model.modelPropertyName}Id: string,
    @Args('input') input: Update${model.modelName}Input,
  ) {
    return this.service.update${model.modelName}(info, ${model.modelPropertyName}Id, input)
  }

  @Mutation(() => ${model.modelName}, { nullable: true })
  ${deleteGuardDecorator ? `@UseGuards(${deleteGuardDecorator})` : ''}
  delete${model.modelName}(
    @Args('${model.modelPropertyName}Id') ${model.modelPropertyName}Id: string,
  ) {
    return this.service.delete${model.modelName}(${model.modelPropertyName}Id)
  }
}
`;
}
function generateFeatureModuleContent(models, npmScope) {
    return `import { Module } from '@nestjs/common'\nimport { ApiCrudDataAccessModule } from '@${npmScope}/api/generated-crud/data-access'\n${models
        .map((model) => `import { Generated${model.modelName}Resolver } from './${toKebabCase(model.modelName)}.resolver'`)
        .join('\n')}\n\n@Module({\n  imports: [ApiCrudDataAccessModule],\n  providers: [${models
        .map((model) => `Generated${model.modelName}Resolver`)
        .join(', ')}],\n})\nexport class ApiGeneratedCrudFeatureModule {}\n`;
}
function generateFeatureIndexContent(models) {
    return `export * from './lib/api-admin-crud-feature.module'\n${models
        .map((model) => `export * from './lib/${toKebabCase(model.modelName)}.resolver'`)
        .join('\n')}\n`;
}
// STEP 3: DEFINE THE CORE LOGIC FUNCTION
// This function contains all the generator's logic but uses injected dependencies, making it testable.
function generateCrudLogic(tree, schema, dependencies) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        // Helper functions that now use injected dependencies
        function getAllPrismaModels(tree) {
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
                        const authConfig = getCrudAuthForModel(prismaSchema, model.name);
                        return {
                            name: model.name,
                            pluralName: dependencies.pluralize(model.name),
                            fields: model.fields.map((field) => (Object.assign({}, field))),
                            primaryField: ((_a = model.fields.find((f) => !f.isId && f.type === 'String')) === null || _a === void 0 ? void 0 : _a.name) || 'name',
                            modelName: model.name,
                            modelPropertyName: singularPropertyName,
                            pluralModelName: dependencies.pluralize(model.name),
                            pluralModelPropertyName: pluralPropertyName,
                            auth: authConfig,
                        };
                    });
                }
                catch (error) {
                    console.error('Error parsing Prisma schema:', error);
                    return [];
                }
            });
        }
        function createLibraries(tree, name) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const dataAccessLibraryRoot = `libs/api/${name}/data-access`;
                const featureLibraryRoot = `libs/api/${name}/feature`;
                const dataAccessTemplatePath = dependencies.joinPathFragments(__dirname, './files/data-access');
                const featureTemplatePath = dependencies.joinPathFragments(__dirname, './files/feature');
                yield dependencies.apiLibraryGenerator(tree, { name }, dataAccessTemplatePath, 'data-access');
                yield dependencies.apiLibraryGenerator(tree, { name }, featureTemplatePath, 'feature');
                return { dataAccessLibraryRoot, featureLibraryRoot };
            });
        }
        function generateModelFiles(tree, dataAccessLibraryRoot, featureLibraryRoot, models, name) {
            return tslib_1.__awaiter(this, void 0, void 0, function* () {
                const npmScope = dependencies.getNpmScope(tree);
                const nameObj = dependencies.names(name);
                const substitutions = Object.assign(Object.assign({}, nameObj), { name, models, npmScope: `@${npmScope}`, apiClassName: 'PrismaCrud', tmpl: '' });
                dependencies.generateFiles(tree, dependencies.joinPathFragments(__dirname, './files/data-access/src/lib'), dependencies.joinPathFragments(dataAccessLibraryRoot, 'src/lib'), Object.assign(Object.assign({}, substitutions), { type: 'data-access' }));
                dependencies.generateFiles(tree, dependencies.joinPathFragments(__dirname, './files/data-access/src'), dependencies.joinPathFragments(dataAccessLibraryRoot, 'src'), Object.assign(Object.assign({}, substitutions), { type: 'data-access' }));
                const featureModuleContent = generateFeatureModuleContent(models, npmScope);
                tree.write(dependencies.joinPathFragments(featureLibraryRoot, 'src/lib/api-admin-crud-feature.module.ts'), featureModuleContent);
                const featureIndexContent = generateFeatureIndexContent(models);
                tree.write(dependencies.joinPathFragments(featureLibraryRoot, 'src/index.ts'), featureIndexContent);
                for (const model of models) {
                    const resolverFilePath = dependencies.joinPathFragments(featureLibraryRoot, `src/lib/${toKebabCase(model.modelName)}.resolver.ts`);
                    const resolverContent = generateResolverContent(model, npmScope);
                    tree.write(resolverFilePath, resolverContent);
                }
            });
        }
        // Main Orchestration Logic
        const name = schema.name || 'generated-crud';
        const models = yield getAllPrismaModels(tree);
        if (models.length === 0) {
            console.error('No Prisma models found');
            return; // Return early for the test case
        }
        const { dataAccessLibraryRoot, featureLibraryRoot } = yield createLibraries(tree, name);
        yield generateModelFiles(tree, dataAccessLibraryRoot, featureLibraryRoot, models, name);
        yield dependencies.formatFiles(tree);
        return () => {
            dependencies.installPackagesTask(tree);
        };
    });
}
// STEP 4: DEFINE THE DEFAULT EXPORT
// This is what Nx CLI executes. It's a simple wrapper that provides the *real* dependencies to the logic function.
function default_1(tree, schema) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const dependencies = {
            formatFiles: devkit_1.formatFiles,
            generateFiles: devkit_1.generateFiles,
            installPackagesTask: devkit_1.installPackagesTask,
            joinPathFragments: devkit_1.joinPathFragments,
            names: devkit_1.names,
            getDMMF: internals_1.getDMMF,
            apiLibraryGenerator: utils_1.apiLibraryGenerator,
            getPrismaSchemaPath: utils_1.getPrismaSchemaPath,
            readPrismaSchema: utils_1.readPrismaSchema,
            getNpmScope: get_npm_scope_1.getNpmScope,
            pluralize: pluralize_1.default,
        };
        try {
            return yield generateCrudLogic(tree, schema, dependencies);
        }
        catch (error) {
            console.error('Error in CRUD generator:', error);
            throw error;
        }
    });
}
//# sourceMappingURL=generator.js.map