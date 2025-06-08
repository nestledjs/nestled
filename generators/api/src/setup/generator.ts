import { addDependenciesToPackageJson, GeneratorCallback, Tree } from '@nx/devkit'
import { execSync } from 'child_process'
import * as yaml from 'js-yaml'
import { removeWorkspacesFromPackageJson, updateTypeScriptConfig } from '@nestled/utils'

interface PnpmWorkspace {
  packages?: string[]
  onlyBuiltDependencies?: string[]
}

function updatePnpmWorkspaceYaml(tree: Tree): void {
  const pnpmWorkspacePath = 'pnpm-workspace.yaml'

  let pnpmWorkspace: PnpmWorkspace

  if (tree.exists(pnpmWorkspacePath)) {
    const existingContent = tree.read(pnpmWorkspacePath, 'utf-8')
    pnpmWorkspace = yaml.load(existingContent)
  } else {
    pnpmWorkspace = {
      packages: ['apps/**', 'libs/**', 'tools/**'],
    }
  }

  // Initialize onlyBuiltDependencies array if it doesn't exist
  if (!pnpmWorkspace.onlyBuiltDependencies) {
    pnpmWorkspace.onlyBuiltDependencies = []
  }

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

  for (const pkg of packagesToBuild) {
    if (!pnpmWorkspace.onlyBuiltDependencies.includes(pkg)) {
      pnpmWorkspace.onlyBuiltDependencies.push(pkg)
    }
  }

  pnpmWorkspace.onlyBuiltDependencies.sort()

  // Write back the updated configuration
  const newContent = yaml.dump(pnpmWorkspace)
  tree.write(pnpmWorkspacePath, newContent)
}

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
      'type-graphql': '^1.1.1',
      'graphql-scalars': '^1.22.4',
      'graphql-fields': '^2.0.3',
      '@prisma/internals': '^5.0.0',
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
      '@prisma/internals': '^5.0.0',
      prisma: '^6.6.0',
      pg: '8.14.1',
      'js-yaml': '^4.1.0',
      '@types/js-yaml': '^4.0.9',
    },
  )

  // Update TypeScript configuration
  updateTypeScriptConfig(tree)

  // Update pnpm-workspace.yaml with build dependencies
  updatePnpmWorkspaceYaml(tree)

  // Remove the workspaces section from package.json if it exists
  removeWorkspacesFromPackageJson(tree)

  // Return a callback that will run after the generator completes
  return () => {
    try {
      execSync('pnpm install', { stdio: 'inherit' })
    } catch (error) {
      console.error('Failed to run pnpm install:', error)
    }
  }
}

export default apiSetupGenerator
