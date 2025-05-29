import { formatFiles, Tree, installPackagesTask, generateFiles, joinPathFragments, names, readProjectConfiguration } from '@nx/devkit'
import { getDMMF } from '@prisma/internals'
import { getPrismaSchemaPath, readPrismaSchema, updateTypeScriptConfigs } from '../shared/utils'
import { GenerateCrudGeneratorSchema } from './schema'
import { execSync } from 'child_process'
import { getNpmScope } from '@nx/js/src/utils/package-json/get-npm-scope'
import pluralize from 'pluralize'

async function getAllPrismaModels(tree: Tree) {
  const prismaPath = getPrismaSchemaPath(tree)
  const prismaSchema = readPrismaSchema(tree, prismaPath)
  if (!prismaSchema) {
    console.error(`No Prisma schema found at ${prismaPath}`)
    return []
  }

  try {
    const dmmf = await getDMMF({ datamodel: prismaSchema })
    const models = dmmf.datamodel.models.map(model => {
      const singularPropertyName = model.name.charAt(0).toLowerCase() + model.name.slice(1);
      const pluralPropertyName = pluralize(singularPropertyName);

      // Handle case where plural is the same as singular (e.g., "data")
      const pluralModelPropertyName = singularPropertyName === pluralPropertyName
        ? `${singularPropertyName}List`
        : pluralPropertyName;

      const modelObj = {
        name: model.name,
        pluralName: pluralize(model.name),
        fields: model.fields,
        primaryField: model.fields.find(f => !f.isId && f.type === 'String')?.name || 'name',
        // Add these properties that might be needed by the templates
        modelName: model.name,
        modelPropertyName: singularPropertyName,
        pluralModelPropertyName: pluralModelPropertyName
      };
      console.log('Model object:', JSON.stringify(modelObj, null, 2));
      return modelObj;
    });
    return models;
  } catch (error) {
    console.error('Error parsing Prisma schema:', error)
    return []
  }
}

async function createLibraries(tree: Tree, overwrite = false) {
  console.log(`Creating Generated CRUD and Public libraries`)

  // Create data-access library for generated-crud
  const dataAccessLibraryRoot = `libs/api/generated-crud/data-access`
  const dataAccessProjectName = 'api-crud-data-access'

  try {
    // First try to remove the library if it exists
    try {
      execSync(
        `nx g rm ${dataAccessProjectName} --forceRemove`,
        {
          stdio: 'inherit',
          cwd: tree.root,
        }
      )
      console.log(`Successfully removed existing ${dataAccessProjectName}`)
    } catch (removeError) {
      console.log(`No existing ${dataAccessProjectName} found, continuing...`)
    }

    // Create the data-access library
    execSync(
      `nx g @nx/nest:library --name=${dataAccessProjectName} --directory=libs/api/generated-crud/data-access --tags=scope:api,type:data-access --linter=eslint --strict --no-interactive --unitTestRunner=jest --importPath=@${getNpmScope(tree)}/api/generated-crud/data-access`,
      {
        stdio: 'inherit',
        cwd: tree.root,
      }
    )
    console.log(`Successfully created ${dataAccessProjectName}`)

    // Update TypeScript configurations for data-access library
    updateTypeScriptConfigs(tree, dataAccessLibraryRoot)
  } catch (error) {
    console.error('Error creating data-access library:', error)
    throw error
  }

  // Create public feature library for individual model resolvers
  const publicFeatureLibraryRoot = `libs/api/public/feature`
  const publicFeatureProjectName = 'api-public-feature'

  // Create public data-access library
  const publicDataAccessLibraryRoot = `libs/api/public/data-access`
  const publicDataAccessProjectName = 'api-public-data-access'

  // Only create or recreate the public libraries if overwrite is true
  if (overwrite) {
    try {
      // First try to remove the feature library if it exists
      try {
        execSync(
          `nx g rm ${publicFeatureProjectName} --forceRemove`,
          {
            stdio: 'inherit',
            cwd: tree.root,
          }
        )
        console.log(`Successfully removed existing ${publicFeatureProjectName}`)
      } catch (removeError) {
        console.log(`No existing ${publicFeatureProjectName} found, continuing...`)
      }

      // Create the public feature library
      execSync(
        `nx g @nx/nest:library --name=${publicFeatureProjectName} --directory=libs/api/public/feature --tags=scope:api,type:feature --linter=eslint --strict --no-interactive --unitTestRunner=jest --importPath=@${getNpmScope(tree)}/api/public/feature`,
        {
          stdio: 'inherit',
          cwd: tree.root,
        }
      )
      console.log(`Successfully created ${publicFeatureProjectName}`)

      // Update TypeScript configurations for public feature library
      updateTypeScriptConfigs(tree, publicFeatureLibraryRoot)

      // First try to remove the data-access library if it exists
      try {
        execSync(
          `nx g rm ${publicDataAccessProjectName} --forceRemove`,
          {
            stdio: 'inherit',
            cwd: tree.root,
          }
        )
        console.log(`Successfully removed existing ${publicDataAccessProjectName}`)
      } catch (removeError) {
        console.log(`No existing ${publicDataAccessProjectName} found, continuing...`)
      }

      // Create the public data-access library
      execSync(
        `nx g @nx/nest:library --name=${publicDataAccessProjectName} --directory=libs/api/public/data-access --tags=scope:api,type:data-access --linter=eslint --strict --no-interactive --unitTestRunner=jest --importPath=@${getNpmScope(tree)}/api/public/data-access`,
        {
          stdio: 'inherit',
          cwd: tree.root,
        }
      )
      console.log(`Successfully created ${publicDataAccessProjectName}`)

      // Update TypeScript configurations for public data-access library
      updateTypeScriptConfigs(tree, publicDataAccessLibraryRoot)
    } catch (error) {
      console.error('Error creating public libraries:', error)
      throw error
    }
  } else {
    console.log(`Skipping recreation of public libraries as overwrite is set to false`)

    // Check if the libraries exist, if not create them
    try {
      const publicFeatureConfig = readProjectConfiguration(tree, publicFeatureProjectName)
      console.log(`Public feature library already exists at ${publicFeatureConfig.root}`)
    } catch (error) {
      console.log(`Public feature library does not exist, creating it...`)
      execSync(
        `nx g @nx/nest:library --name=${publicFeatureProjectName} --directory=libs/api/public/feature --tags=scope:api,type:feature --linter=eslint --strict --no-interactive --unitTestRunner=jest --importPath=@${getNpmScope(tree)}/api/public/feature`,
        {
          stdio: 'inherit',
          cwd: tree.root,
        }
      )
      updateTypeScriptConfigs(tree, publicFeatureLibraryRoot)
    }

    try {
      const publicDataAccessConfig = readProjectConfiguration(tree, publicDataAccessProjectName)
      console.log(`Public data-access library already exists at ${publicDataAccessConfig.root}`)
    } catch (error) {
      console.log(`Public data-access library does not exist, creating it...`)
      execSync(
        `nx g @nx/nest:library --name=${publicDataAccessProjectName} --directory=libs/api/public/data-access --tags=scope:api,type:data-access --linter=eslint --strict --no-interactive --unitTestRunner=jest --importPath=@${getNpmScope(tree)}/api/public/data-access`,
        {
          stdio: 'inherit',
          cwd: tree.root,
        }
      )
      updateTypeScriptConfigs(tree, publicDataAccessLibraryRoot)
    }
  }

  return { dataAccessLibraryRoot, publicFeatureLibraryRoot, publicDataAccessLibraryRoot }
}

// Helper function to convert camelCase to kebab-case
function toKebabCase(str: string): string {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
}

async function generateModelFiles(tree: Tree, dataAccessLibraryRoot: string, publicFeatureLibraryRoot: string, publicDataAccessLibraryRoot: string, models: { name: string; fields: readonly { name: string; type: string }[]; primaryField: string; modelName: string; modelPropertyName: string; pluralModelPropertyName: string }[], name = 'generated-crud', overwrite = false) {
  console.log(`Generating files for ${models.length} models`)
  console.log('Name parameter in generateModelFiles:', name)

  // Ensure name is not undefined or empty
  if (!name) {
    console.log('Name parameter is empty, using default "generated-crud"')
    name = 'generated-crud'
  }

  // Generate service files in data-access library
  // Ensure we have valid values for template substitutions
  const nameObj = names(name || 'generated-crud');
  const substitutions = {
    name: name || 'generated-crud',
    models,
    npmScope: `@${getNpmScope(tree)}`,
    apiClassName: 'PrismaCrud',
    ...nameObj,
    tmpl: '',
    type: 'data-access',
  };

  console.log('Final data access template substitutions:', {
    ...substitutions,
    models: substitutions.models.length,
  });

  // Generate the service file with the new name
  generateFiles(
    tree,
    joinPathFragments(__dirname, './files/data-access/src/lib'),
    joinPathFragments(dataAccessLibraryRoot, 'src/lib'),
    {
      ...substitutions,
    }
  )

  // Generate the index.ts file for data-access library
  generateFiles(
    tree,
    joinPathFragments(__dirname, './files/data-access/src'),
    joinPathFragments(dataAccessLibraryRoot, 'src'),
    {
      ...substitutions,
    }
  )


  // Create public data-access service file
  const publicDataAccessServiceContent = `import { Injectable } from '@nestjs/common'

@Injectable()
export class ApiPublicDataAccessService {
  constructor() {}
}
`;

  // Create public data-access module file
  const publicDataAccessModuleContent = `import { Module } from '@nestjs/common'
import { ApiPublicDataAccessService } from './api-public-data-access.service'

@Module({
  providers: [ApiPublicDataAccessService],
  exports: [ApiPublicDataAccessService],
})
export class ApiPublicDataAccessModule {}
`;

  // Create public data-access index file
  const publicDataAccessIndexContent = `export * from './lib/api-public-data-access.module'
export * from './lib/api-public-data-access.service'
`;

  // Write public data-access files if overwrite is true or if they don't exist
  if (overwrite || !tree.exists(joinPathFragments(publicDataAccessLibraryRoot, 'src/lib/api-public-data-access.service.ts'))) {
    tree.write(
      joinPathFragments(publicDataAccessLibraryRoot, 'src/lib/api-public-data-access.service.ts'),
      publicDataAccessServiceContent
    );
  }

  if (overwrite || !tree.exists(joinPathFragments(publicDataAccessLibraryRoot, 'src/lib/api-public-data-access.module.ts'))) {
    tree.write(
      joinPathFragments(publicDataAccessLibraryRoot, 'src/lib/api-public-data-access.module.ts'),
      publicDataAccessModuleContent
    );
  }

  if (overwrite || !tree.exists(joinPathFragments(publicDataAccessLibraryRoot, 'src/index.ts'))) {
    tree.write(
      joinPathFragments(publicDataAccessLibraryRoot, 'src/index.ts'),
      publicDataAccessIndexContent
    );
  }

  // Create public feature module file
  const publicModuleContent = `import { Module } from '@nestjs/common'
import { ApiCrudDataAccessModule } from '@${getNpmScope(tree)}/api/generated-crud/data-access'
import { ApiPublicDataAccessModule } from '@${getNpmScope(tree)}/api/public/data-access'
${models.map(model => `import { ${model.modelName}Resolver } from './${toKebabCase(model.modelName)}.resolver'`).join('\n')}

@Module({
  imports: [ApiCrudDataAccessModule, ApiPublicDataAccessModule],
  providers: [${models.map(model => `${model.modelName}Resolver`).join(', ')}],
})
export class ApiPublicFeatureModule {}
`;

  // Write public feature module file if overwrite is true or if it doesn't exist
  if (overwrite || !tree.exists(joinPathFragments(publicFeatureLibraryRoot, 'src/lib/api-public-feature.module.ts'))) {
    tree.write(
      joinPathFragments(publicFeatureLibraryRoot, 'src/lib/api-public-feature.module.ts'),
      publicModuleContent
    );
  }

  // Create index.ts file for public library
  const publicIndexContent = `export * from './lib/api-public-feature.module'
${models.map(model => `export * from './lib/${toKebabCase(model.modelName)}.resolver'`).join('\n')}
`;

  // Write public feature index file if overwrite is true or if it doesn't exist
  if (overwrite || !tree.exists(joinPathFragments(publicFeatureLibraryRoot, 'src/index.ts'))) {
    tree.write(
      joinPathFragments(publicFeatureLibraryRoot, 'src/index.ts'),
      publicIndexContent
    );
  }

  // Generate individual resolver files for each model in public library
  for (const model of models) {
    const resolverFilePath = joinPathFragments(publicFeatureLibraryRoot, `src/lib/${toKebabCase(model.modelName)}.resolver.ts`);

    // Only create the resolver file if it doesn't exist or if overwrite is true
    if (overwrite || !tree.exists(resolverFilePath)) {
      console.log(`Creating resolver file for ${model.modelName} at ${resolverFilePath}`);

      const resolverContent = `import { Args, Mutation, Query, Resolver, Info } from '@nestjs/graphql'
import { UseGuards } from '@nestjs/common'
import { GraphQLResolveInfo } from 'graphql'
import {
  CorePaging
} from '@${getNpmScope(tree)}/api/core/data-access'
import { ApiCrudDataAccessService } from '@${getNpmScope(tree)}/api/generated-crud/data-access'
import {
  ${model.modelName},
} from '@${getNpmScope(tree)}/api/core/models'
import {
  Create${model.modelName}Input,
  List${model.modelName}Input,
  Update${model.modelName}Input,
} from '@${getNpmScope(tree)}/api/generated-crud/data-access'
import {
  GqlAuthAdminGuard,
} from '@${getNpmScope(tree)}/api/auth/util'

@Resolver(() => ${model.modelName})
export class ${model.modelName}Resolver {
  constructor(
    private readonly service: ApiCrudDataAccessService,
  ) {}

  @Query(() => [${model.modelName}], { nullable: true })
  @UseGuards(GqlAuthAdminGuard)
  ${model.pluralModelPropertyName}(
    @Info() info: GraphQLResolveInfo,
    @Args({ name: 'input', type: () => List${model.modelName}Input, nullable: true }) input?: List${model.modelName}Input,
  ) {
    return this.service.${model.pluralModelPropertyName}(info, input)
  }

  @Query(() => CorePaging, { nullable: true })
  @UseGuards(GqlAuthAdminGuard)
  ${model.pluralModelPropertyName}Count(
    @Args({ name: 'input', type: () => List${model.modelName}Input, nullable: true }) input?: List${model.modelName}Input,
  ) {
    return this.service.${model.pluralModelPropertyName}Count(input)
  }

  @Query(() => ${model.modelName}, { nullable: true })
  @UseGuards(GqlAuthAdminGuard)
  ${model.modelPropertyName}(
    @Info() info: GraphQLResolveInfo,
    @Args('${model.modelPropertyName}Id') ${model.modelPropertyName}Id: string
  ) {
    return this.service.${model.modelPropertyName}(info, ${model.modelPropertyName}Id)
  }

  @Mutation(() => ${model.modelName}, { nullable: true })
  @UseGuards(GqlAuthAdminGuard)
  create${model.modelName}(
    @Info() info: GraphQLResolveInfo,
    @Args('input') input: Create${model.modelName}Input,
  ) {
    return this.service.create${model.modelName}(info, input)
  }

  @Mutation(() => ${model.modelName}, { nullable: true })
  @UseGuards(GqlAuthAdminGuard)
  update${model.modelName}(
    @Info() info: GraphQLResolveInfo,
    @Args('${model.modelPropertyName}Id') ${model.modelPropertyName}Id: string,
    @Args('input') input: Update${model.modelName}Input,
  ) {
    return this.service.update${model.modelName}(info, ${model.modelPropertyName}Id, input)
  }

  @Mutation(() => Boolean, { nullable: true })
  @UseGuards(GqlAuthAdminGuard)
  delete${model.modelName}(
    @Args('${model.modelPropertyName}Id') ${model.modelPropertyName}Id: string,
  ) {
    return this.service.delete${model.modelName}(${model.modelPropertyName}Id)
  }
}
`;

      tree.write(resolverFilePath, resolverContent);
    } else {
      console.log(`Skipping creation of resolver file for ${model.modelName} as it already exists and overwrite is false`);
    }
  }
}

export default async function(tree: Tree, schema: GenerateCrudGeneratorSchema) {
  try {
    console.log('Starting CRUD generator')

    // If name is not provided, set a default value
    if (!schema.name) {
      console.log('Name property is missing, setting default value "generated-crud"')
      schema.name = 'generated-crud'
    } else {
      console.log(`Using provided name: "${schema.name}"`)
    }

    // Get all Prisma models
    const models = await getAllPrismaModels(tree)
    if (models.length === 0) {
      console.error('No Prisma models found')
      return
    }

    console.log(`Found ${models.length} models`)

    // Create libraries if they don't exist
    const { dataAccessLibraryRoot, publicFeatureLibraryRoot, publicDataAccessLibraryRoot } = await createLibraries(tree, schema.overwrite)

    // Generate model files with the provided name or default to 'generated-crud'
    await generateModelFiles(tree, dataAccessLibraryRoot, publicFeatureLibraryRoot, publicDataAccessLibraryRoot, models, schema.name || 'generated-crud', schema.overwrite)

    // Format files
    await formatFiles(tree)

    return () => {
      installPackagesTask(tree)
    }
  } catch (error) {
    console.error('Error in CRUD generator:', error)
    throw error
  }
}
