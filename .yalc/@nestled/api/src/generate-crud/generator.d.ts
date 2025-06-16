import { formatFiles, generateFiles, installPackagesTask, joinPathFragments, names, Tree } from '@nx/devkit';
import { getDMMF } from '@prisma/internals';
import { apiLibraryGenerator, getPrismaSchemaPath, readPrismaSchema } from '@nestled/utils';
import { GenerateCrudGeneratorSchema } from './schema';
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope';
import pluralize from 'pluralize';
interface CrudAuthConfig {
    readOne?: string;
    readMany?: string;
    count?: string;
    create?: string;
    update?: string;
    delete?: string;
}
interface ModelType {
    name: string;
    pluralName: string;
    fields: ReadonlyArray<Record<string, unknown> & {
        name: string;
        type: string;
    }>;
    primaryField: string;
    modelName: string;
    modelPropertyName: string;
    pluralModelName: string;
    pluralModelPropertyName: string;
    auth?: CrudAuthConfig;
}
export interface GenerateCrudGeneratorDependencies {
    formatFiles: typeof formatFiles;
    generateFiles: typeof generateFiles;
    installPackagesTask: typeof installPackagesTask;
    joinPathFragments: typeof joinPathFragments;
    names: typeof names;
    getDMMF: typeof getDMMF;
    apiLibraryGenerator: typeof apiLibraryGenerator;
    getPrismaSchemaPath: typeof getPrismaSchemaPath;
    readPrismaSchema: typeof readPrismaSchema;
    getNpmScope: typeof getNpmScope;
    pluralize: typeof pluralize;
}
export declare function parseCrudAuth(comment: string): CrudAuthConfig | null;
export declare function getCrudAuthForModel(schema: string, modelName: string): CrudAuthConfig;
export declare function getGuardForAuthLevel(level: string): string | null;
export declare function generateResolverContent(model: ModelType, npmScope: string): string;
export declare function generateFeatureModuleContent(models: ModelType[], npmScope: string): string;
export declare function generateFeatureIndexContent(models: ModelType[]): string;
export declare function generateCrudLogic(tree: Tree, schema: GenerateCrudGeneratorSchema, dependencies: GenerateCrudGeneratorDependencies): Promise<() => void>;
export default function (tree: Tree, schema: GenerateCrudGeneratorSchema): Promise<() => void>;
export {};
