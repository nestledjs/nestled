import { addDependenciesToPackageJson, GeneratorCallback, Tree } from '@nx/devkit'
import { pnpmInstallCallback, updatePnpmWorkspaceConfig } from '@nestled/utils'

export async function apiSetupGenerator(tree: Tree): Promise<GeneratorCallback> {
  // Add dependencies
  addDependenciesToPackageJson(
    tree,
    {
      '@nestjs/common': '^10.0.0',
      '@nestjs/config': '^3.0.0',
      '@nestjs/core': '^10.0.0',
      '@nestjs/graphql': '^12.0.0',
      '@nestjs/platform-express': '^10.0.0',
      '@nestjs/apollo': '^12.0.0',
      '@nestjs/jwt': '^10.0.0',
      '@nestjs/passport': '^10.0.0',
      '@nestjs/axios': '^3.0.0',
      '@prisma/client': '^6.6.0',
      '@apollo/server': '^4.9.0',
      bcryptjs: '^2.4.3',
      'class-validator': '^0.14.0',
      'cookie-parser': '^1.4.6',
      express: '^4.18.0',
      graphql: '^16.0.0',
      'graphql-subscriptions': '^2.0.0',
      joi: '^17.9.0',
      nodemailer: '^6.9.0',
      'passport-jwt': '^4.0.1',
      'reflect-metadata': '^0.1.13',
      rxjs: '^7.8.0',
      'type-graphql': '^2.0.0-rc.2',
      'graphql-scalars': '^1.22.4',
      'graphql-fields': '^2.0.3',
      'class-transformer': '^0.5.1',
      '@paljs/plugins': '^4.1.0',
    },
    {
      nx: '21.1.3',
      '@nx/js': '21.1.3',
      '@nx/nest': '21.1.3',
      '@nx/node': '21.1.3',
      '@nx/webpack': '21.1.3',
      '@types/bcryptjs': '^2.4.2',
      '@types/cookie-parser': '^1.4.3',
      '@types/express': '^4.17.17',
      '@types/nodemailer': '^6.4.7',
      '@types/passport-jwt': '^3.0.8',
      '@prisma/internals': '^6.9.0',
      prisma: '^6.9.0',
      pg: '8.14.1',
      yaml: '^2.4.2',
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
  ]
  updatePnpmWorkspaceConfig(tree, { onlyBuiltDependencies: packagesToBuild })

  // Return a callback that will run after the generator completes
  return pnpmInstallCallback()
}

export default apiSetupGenerator
