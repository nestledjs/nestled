import { addDependenciesToPackageJson, GeneratorCallback, Tree } from '@nx/devkit'
import { pnpmInstallCallback, updatePnpmWorkspaceConfig } from '@nestledjs/utils'

function ensureNpmrc(tree: Tree) {
  const npmrcPath = '.npmrc'
  const content = 'ignore-workspace-root-check=true\n'
  tree.write(npmrcPath, content)
}

export async function apiSetupGenerator(tree: Tree): Promise<GeneratorCallback> {
  // Add dependencies
  addDependenciesToPackageJson(
    tree,
    {
      '@nestjs/apollo': '^13.1.0',
      '@nestjs/axios': '^4.0.0',
      '@nestjs/common': '^11.1.3',
      '@nestjs/config': '^4.0.2',
      '@nestjs/core': '^11.1.3',
      '@nestjs/graphql': '^13.1.0',
      '@nestjs/jwt': '^11.0.0',
      '@nestjs/passport': '^11.0.5',
      '@nestjs/platform-express': '^11.1.3',
      axios: '^1.9.0',
      bcryptjs: '^3.0.2',
      express: '^5.1.0',
      graphql: '^16.11.0',
      'graphql-query-complexity': '1.1.0',
      'graphql-scalars': '^1.24.2',
      'graphql-subscriptions': '^3.0.0',
      'graphql-ws': '^6.0.5',
      joi: '^17.13.3',
      nodemailer: '^7.0.3',
      'reflect-metadata': '^0.2.2',
      rxjs: '^7.8.2',
      'type-graphql': '^2.0.0-rc.2',
      'graphql-fields': '^2.0.3',
      'class-validator': '^0.14.0',
      'class-transformer': '^0.5.1',
      'graphql-redis-subscriptions': '^2.7.0',
      ioredis: '^5.6.1',
      'cookie-parser': '^1.4.7',
      'passport-jwt': '^4.0.1',
    },
    {
      nx: '21.2.1',
      '@nx/js': '21.2.1',
      '@nx/nest': '21.2.1',
      '@nx/node': '21.2.1',
      '@nx/webpack': '21.2.1',
      '@nestjs/schematics': '^11.0.5',
      '@nestjs/testing': '^11.1.3',
      '@prisma/extension-optimize': '2.0.0',
      '@swc-node/register': '~1.10.10',
      '@swc/cli': '~0.7.7',
      '@swc/core': '~1.12.1',
      '@types/cookie-parser': '^1.4.3',
      '@types/express': '^5.0.3',
      '@types/nodemailer': '^6.4.7',
      '@types/passport-jwt': '^4.0.1',
      '@types/node': '^24.0.1',
      '@prisma/internals': '^6.11.0',
      autoprefixer: '10.4.21',
      jest: '^30.0.0',
      'jest-environment-node': '^30.0.0',
      pg: '8.16.0',
      prisma: '^6.11.0',
      'ts-node': '10.9.2',
      yaml: '^2.4.2',
      'ts-loader': '^9.5.2',
      'webpack-cli': '^6.0.1',
      'webpack-node-externals': '^3.0.0',
      'tsconfig-paths-webpack-plugin': '^4.2.0',
      'prisma-graphql-type-decimal': '^3.0.1',
      'graphql-type-json': '^0.3.2',
    },
  )

  // Update pnpm-workspace.yaml with build dependencies
  const packagesToBuild = [
    '@apollo/protobufjs',
    '@parcel/watcher',
    '@prisma/client',
    '@prisma/extension-optimize',
    '@prisma/engines',
    'esbuild',
    'nx',
    'prisma',
    'ioredis',
    'prisma-graphql-type-decimal',
    '@nestjs/core',
    'type-graphql',
    'express',
    'unrs-resolver',
    '@swc/core',
  ]
  updatePnpmWorkspaceConfig(tree, { onlyBuiltDependencies: packagesToBuild })

  // Ensure .npmrc exists with the required content
  ensureNpmrc(tree)

  // Return a callback that will run after the generator completes
  return pnpmInstallCallback()
}

export default apiSetupGenerator
