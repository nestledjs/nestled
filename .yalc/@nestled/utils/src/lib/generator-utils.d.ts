import { GeneratorCallback, Tree } from '@nx/devkit';
import { AddToModulesOptions, GenerateTemplateOptions, ModelType } from './generator-types';
export declare function removeWorkspacesFromPackageJson(tree: Tree): void;
export declare function addScriptToPackageJson(tree: Tree, scriptName: string, scriptCommand: string): void;
export declare function deleteFiles(tree: Tree, filesToDelete: string[]): void;
export declare function deleteDirectory(tree: Tree, dirPath: string): void;
export declare function endsWithQuestionMark(str: any): boolean;
export declare function removeQuestionMarkAtEnd(str: any): any;
export declare function getPrismaSchemaPath(tree: any): any;
export declare function readPrismaSchema(tree: any, prismaPath: any): any;
export declare function mapPrismaTypeToNestJsType(prismaType: string): string;
export declare function parsePrismaSchema(schemaContent: string, modelName: string): Promise<{
    name: string;
    type: string;
    optional: boolean;
}[]>;
export declare function getNpmScope(tree: Tree): string;
export declare function generateTemplateFiles<T = any>({ tree, schema, libraryRoot, templatePath, npmScope, }: GenerateTemplateOptions & {
    schema: T;
}): void;
/**
 * Installs dependencies and devDependencies in the package.json file,
 * and configures Nx project graph plugins when appropriate.
 *
 * @param tree - The Nx Tree object (virtual filesystem).
 * @param dependencies - An object containing the dependencies to be added.
 * @param devDependencies - An object containing the devDependencies to be added.
 * @param options - Additional options for plugin configuration
 */
export declare function installPlugins(tree: Tree, dependencies?: Record<string, string>, devDependencies?: Record<string, string>, options?: {
    configureProjectGraph?: boolean;
    pluginNames?: string[];
}): Promise<() => any>;
/**
 * Updates tsconfig.base.json to include a new library path
 * @param tree The file system tree
 * @param importPath The import path for the library (e.g., @org/my-lib)
 * @param libraryRoot The root path of the library (e.g., libs/my-lib)
 */
export declare function updateTsConfigPaths(tree: Tree, importPath: string, libraryRoot: string): void;
export declare function updateTypeScriptConfigs(tree: Tree, libraryRoot: string): void;
export declare function getAllPrismaModels(tree: Tree): Promise<ModelType[]>;
export declare function updatePnpmWorkspaceConfig(tree: Tree, options: {
    packages?: string[];
    onlyBuiltDependencies?: string[];
}): void;
export declare function pnpmInstallCallback(): GeneratorCallback;
export declare function addToModules({ tree, modulePath, moduleArrayName, moduleToAdd, importPath }: AddToModulesOptions): void;
export declare function apiLibraryGenerator<T = any>(tree: Tree, schema: T, templateRootPath: string, type?: string, addModuleImport?: boolean): Promise<() => void>;
export declare function getPluralName(name: string): string;
