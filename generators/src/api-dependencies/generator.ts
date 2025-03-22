import { addDependenciesToPackageJson, Tree } from '@nx/devkit'

export async function apiDependenciesGenerator(tree: Tree) {
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
      '@prisma/client': '^5.0.0',
      'apollo-server-express': '^3.12.0',
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
    },
    {
      nx: '20.6.2',
      '@nx/js': '20.6.2',
      '@nx/nest': '20.6.2',
      '@nx/node': '20.6.2',
      '@nx/webpack': '20.6.2',
      '@types/bcryptjs': '^2.4.2',
      '@types/cookie-parser': '^1.4.3',
      '@types/nodemailer': '^6.4.7',
      '@types/passport-jwt': '^3.0.8',
      prisma: '^5.0.0',
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

  // Create setup.md file with generator commands
  const setupContent = `# Setup Instructions

Run the following commands in order to set up your project:

\`\`\`sh
nx g @nestled/generators:api-dependencies
\`\`\`

\`\`\`sh
nx g @nestled/generators:api-app
\`\`\`

\`\`\`sh
pnpm approve-builds
\`\`\`

\`\`\`sh
nx g @nestled/generators:api-libs
\`\`\`

\`\`\`sh
nx g @nestled/generators:project-config
\`\`\`

\`\`\`sh
nx g @nestled/generators:workspace-setup
\`\`\`
`

  tree.write('setup.md', setupContent)
}

export default apiDependenciesGenerator
