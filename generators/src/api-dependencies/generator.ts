import { addDependenciesToPackageJson, Tree, GeneratorCallback, readJson } from '@nx/devkit'
import { execSync } from 'child_process'

export async function apiDependenciesGenerator(tree: Tree): Promise<GeneratorCallback> {
  // Add dependencies
  await addDependenciesToPackageJson(
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
    },
    {
      nx: '20.8.0',
      '@nx/js': '20.8.0',
      '@nx/nest': '20.8.0',
      '@nx/node': '20.8.0',
      '@nx/webpack': '20.8.0',
      '@types/bcryptjs': '^2.4.2',
      '@types/cookie-parser': '^1.4.3',
      '@types/nodemailer': '^6.4.7',
      '@types/passport-jwt': '^3.0.8',
      '@prisma/internals': '^5.0.0',
      prisma: '^6.6.0',
      pg: '8.14.1',
    },
  )

  // Update TypeScript configuration
  const tsConfigPath = 'tsconfig.base.json'
  if (tree.exists(tsConfigPath)) {
    const tsConfigContent = tree.read(tsConfigPath, 'utf-8')
    const tsConfig = JSON.parse(tsConfigContent)

    // Update module and moduleResolution
    tsConfig.compilerOptions.module = 'CommonJS'
    tsConfig.compilerOptions.moduleResolution = 'node'

    // Set baseUrl for path aliases
    tsConfig.compilerOptions.baseUrl = '.'

    // Remove emitDeclarationOnly if it exists
    if (tsConfig.compilerOptions.emitDeclarationOnly !== undefined) {
      delete tsConfig.compilerOptions.emitDeclarationOnly
    }

    // Write back the updated configuration
    tree.write(tsConfigPath, JSON.stringify(tsConfig, null, 2))
  }

  // Update pnpm.onlyBuiltDependencies in package.json
  const packageJsonPath = 'package.json'
  if (tree.exists(packageJsonPath)) {
    const packageJson = readJson(tree, packageJsonPath)
    
    // Initialize pnpm section if it doesn't exist
    if (!packageJson.pnpm) {
      packageJson.pnpm = {}
    }
    
    // Initialize onlyBuiltDependencies array if it doesn't exist
    if (!packageJson.pnpm.onlyBuiltDependencies) {
      packageJson.pnpm.onlyBuiltDependencies = []
    }
    
    // Add the specified packages if they don't already exist
    const requiredPackages = [
      '@apollo/protobufjs',
      '@nestjs/core',
      '@parcel/watcher',
      '@prisma/client',
      '@prisma/engines',
      'esbuild',
      'nx',
      'prisma',
      'type-graphql'
    ]
    
    for (const pkg of requiredPackages) {
      if (!packageJson.pnpm.onlyBuiltDependencies.includes(pkg)) {
        packageJson.pnpm.onlyBuiltDependencies.push(pkg)
      }
    }
    
    // Add GraphQL model generation script
    if (!packageJson.scripts) {
      packageJson.scripts = {}
    }
    
    packageJson.scripts['generate:models'] = 'ts-node libs/api/core/data-access/src/scripts/generate-models.ts'
    
    // Write back the updated package.json
    tree.write(packageJsonPath, JSON.stringify(packageJson, null, 2))
  }

  // Return a callback that will run after the generator completes
  return () => {
    try {
      execSync('pnpm install', { stdio: 'inherit' })
    } catch (error) {
      console.error('Failed to run pnpm install:', error)
    }
  }
}

export default apiDependenciesGenerator
