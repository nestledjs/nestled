"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sdkGeneratorLogic = sdkGeneratorLogic;
exports.default = default_1;
const tslib_1 = require("tslib");
const devkit_1 = require("@nx/devkit");
const path = tslib_1.__importStar(require("path"));
const fs = tslib_1.__importStar(require("fs"));
const utils_1 = require("@nestled/utils");
const js_1 = require("@nx/js");
const SCALAR_TYPES = [
    'String', 'Int', 'Boolean', 'Float', 'DateTime', 'Json', 'BigInt', 'Decimal', 'Bytes'
];
function kebabCase(str) {
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/\s+/g, '-')
        .toLowerCase();
}
function parsePrismaModels(schemaContent) {
    const modelRegex = /model (\w+) \{([\s\S]*?)\}/g;
    const fieldRegex = /^(\s*)(\w+)\s+([\w[]]+)(\??)(\s+@\w+.*)?$/gm;
    const models = {};
    let match;
    while ((match = modelRegex.exec(schemaContent))) {
        const [, modelName, body] = match;
        const fields = [];
        let fieldMatch;
        while ((fieldMatch = fieldRegex.exec(body))) {
            const [, , name, type, , attrs] = fieldMatch;
            const isList = type.endsWith('[]');
            const isRelation = attrs && attrs.includes('@relation');
            fields.push({
                name,
                type: type.replace('[]', ''),
                isList,
                isRelation,
            });
        }
        models[modelName] = { fields };
    }
    return models;
}
function getFragmentFields(fields) {
    return fields
        .filter(f => !f.isList &&
        !f.isRelation &&
        SCALAR_TYPES.includes(f.type) &&
        f.name !== 'id' &&
        !f.name.endsWith('Id'))
        .map(f => f.name)
        .join('\n  ');
}
function ensureSdkLibrary(tree, dependencies) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        const sdkPath = 'libs/shared/sdk';
        if (!tree.exists(sdkPath)) {
            // Create the sdk library if it doesn't exist
            yield dependencies.libraryGenerator(tree, {
                name: 'sdk',
                directory: 'libs/shared/sdk',
                importPath: '@shared/sdk',
                publishable: false,
                buildable: false,
                unitTestRunner: 'vitest',
                linter: 'eslint',
                tags: 'type:shared,scope:shared'
            });
        }
    });
}
function readPrismaSchema(absSchemaPath, dependencies) {
    if (dependencies.statSync(absSchemaPath).isDirectory()) {
        // Read all .prisma files in the directory and concatenate
        const files = dependencies.readdirSync(absSchemaPath)
            .filter(f => f.endsWith('.prisma'))
            .map(f => dependencies.join(absSchemaPath, f));
        return files.map(f => dependencies.readFileSync(f, 'utf-8')).join('\n');
    }
    else {
        // Read the file directly
        return dependencies.readFileSync(absSchemaPath, 'utf-8');
    }
}
// Group dependencies
const defaultDependencies = {
    formatFiles: devkit_1.formatFiles,
    installPackagesTask: devkit_1.installPackagesTask,
    generateFiles: devkit_1.generateFiles,
    joinPathFragments: devkit_1.joinPathFragments,
    readJson: devkit_1.readJson,
    addDependenciesToPackageJson: devkit_1.addDependenciesToPackageJson,
    addScriptToPackageJson: utils_1.addScriptToPackageJson,
    getPluralName: utils_1.getPluralName,
    libraryGenerator: js_1.libraryGenerator,
    // Specific functions from path and fs
    join: path.join,
    existsSync: fs.existsSync,
    statSync: fs.statSync,
    readdirSync: fs.readdirSync,
    readFileSync: fs.readFileSync,
};
function sdkGeneratorLogic(tree_1, schema_1) {
    return tslib_1.__awaiter(this, arguments, void 0, function* (tree, schema, dependencies = defaultDependencies) {
        var _a;
        // 1. Read prisma schema path from package.json
        const pkgJson = dependencies.readJson(tree, 'package.json');
        const prismaSchemaPath = (_a = pkgJson.prisma) === null || _a === void 0 ? void 0 : _a.schema;
        if (!prismaSchemaPath)
            throw new Error('Prisma schema path not found in package.json');
        const absSchemaPath = dependencies.join(tree.root, prismaSchemaPath);
        if (!dependencies.existsSync(absSchemaPath))
            throw new Error(`Prisma schema not found at ${absSchemaPath}`);
        const schemaContent = readPrismaSchema(absSchemaPath, dependencies);
        // 2. Parse models
        const models = parsePrismaModels(schemaContent);
        // 3. Ensure sdk library exists
        yield ensureSdkLibrary(tree, dependencies);
        // 4. For each model, generate files
        for (const [modelName, { fields }] of Object.entries(models)) {
            const kebabName = kebabCase(modelName);
            const modelDir = `libs/shared/sdk/src/graphql/${kebabName}`;
            if (tree.exists(modelDir))
                continue;
            const className = modelName;
            const propertyName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
            const pluralClassName = dependencies.getPluralName(className);
            const pluralPropertyName = dependencies.getPluralName(propertyName);
            const fragmentFields = getFragmentFields(fields);
            dependencies.generateFiles(tree, dependencies.joinPathFragments(__dirname, './graphql'), modelDir, { className, propertyName, pluralClassName, pluralPropertyName, fragmentFields, kebabName, tmpl: '' });
            // Rename generated files to kebab-case
            ['fragments', 'mutations', 'queries'].forEach(type => {
                const oldPath = dependencies.join(modelDir, `__name__-${type}.graphql`);
                const newPath = dependencies.join(modelDir, `${kebabName}-${type}.graphql`);
                if (tree.exists(oldPath)) {
                    tree.rename(oldPath, newPath);
                }
            });
        }
        // 5. Always write codegen.yml and index.ts
        const sdkSrcDir = 'libs/shared/sdk/src';
        dependencies.generateFiles(tree, dependencies.joinPathFragments(__dirname, './files'), sdkSrcDir, { tmpl: '' });
        // 6. Add scripts to package.json
        dependencies.addScriptToPackageJson(tree, 'sdk', 'graphql-codegen --config libs/shared/sdk/src/codegen.yml');
        dependencies.addScriptToPackageJson(tree, 'sdk:watch', 'pnpm sdk --watch');
        // 7. Add GraphQL Codegen packages as devDependencies
        dependencies.addDependenciesToPackageJson(tree, {}, {
            '@graphql-codegen/cli': '^5.0.7',
            '@graphql-codegen/typescript': '^4.1.6',
            '@graphql-codegen/introspection': '^4.0.3',
            '@graphql-codegen/typescript-document-nodes': '^4.0.16',
            '@graphql-codegen/typescript-operations': '^4.6.1',
            '@graphql-codegen/typescript-react-apollo': '^4.3.3',
        });
        yield dependencies.formatFiles(tree);
        return () => {
            dependencies.installPackagesTask(tree);
        };
    });
}
function default_1(tree, schema) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        return sdkGeneratorLogic(tree, schema);
    });
}
//# sourceMappingURL=generator.js.map