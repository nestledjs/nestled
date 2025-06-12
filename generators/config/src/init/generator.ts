import { addDependenciesToPackageJson, generateFiles, GeneratorCallback, logger, Tree } from '@nx/devkit'
import {
  addScriptToPackageJson,
  pnpmInstallCallback,
  removeWorkspacesFromPackageJson,
  updatePnpmWorkspaceConfig,
} from '@nestled/utils'
import * as path from 'path'

function handlePrettierConfig(tree: Tree) {
  const filesDir = path.join(__dirname, 'files')
  generateFiles(tree, filesDir, '.', { dot: '.', tmpl: '' })
  logger.info('✅ Generated .prettierrc and .prettierignore files')
}

function handleEnvExample(tree: Tree) {
  const filesDir = path.join(__dirname, 'files')
  generateFiles(tree, filesDir, '.', { dot: '.', tmpl: '' })
  logger.info('✅ Generated .env.example file')

  // Copy .env.example to .env if .env does not exist
  const envExamplePath = '.env.example'
  const envPath = '.env'
  if (!tree.exists(envPath) && tree.exists(envExamplePath)) {
    const envExampleContent = tree.read(envExamplePath, 'utf-8')
    tree.write(envPath, envExampleContent)
    logger.info('✅ Created .env from .env.example')
  }
}

function getWorkspaceName(tree: Tree): string {
  const nxJsonPath = 'nx.json'
  if (tree.exists(nxJsonPath)) {
    const nxJson = JSON.parse(tree.read(nxJsonPath, 'utf-8') || '{}')
    if (nxJson?.npmScope) return nxJson.npmScope
  }
  const packageJsonPath = 'package.json'
  if (tree.exists(packageJsonPath)) {
    const packageJson = JSON.parse(tree.read(packageJsonPath, 'utf-8') || '{}')
    if (packageJson.name) return packageJson.name
  }
  return 'my-workspace'
}

function handleDockerFilesAndScripts(tree: Tree) {
  // Generate Docker files in .dev directory
  const filesDir = path.join(__dirname, 'files', '.dev')
  generateFiles(tree, filesDir, '.dev', { dot: '.', tmpl: '' })
  logger.info('✅ Generated Dockerfile and docker-compose.yml in .dev directory')

  // Add only Docker-related scripts to package.json
  const packageJsonPath = 'package.json'
  if (tree.exists(packageJsonPath)) {
    const workspaceName = getWorkspaceName(tree)
    const imageName = `${workspaceName}/api`
    const packageJsonContent = JSON.parse(tree.read(packageJsonPath, 'utf-8') || '{}')
    packageJsonContent.scripts = {
      ...packageJsonContent.scripts,
      'docker:build': `docker build -f .dev/Dockerfile -t ${imageName} .`,
      'docker:down': 'docker compose -f .dev/docker-compose.yml down',
      'docker:push': `docker push ${imageName}`,
      'docker:run': `docker run -it -p 8000:3000 ${imageName}`,
      'docker:up': 'docker compose -f .dev/docker-compose.yml up',
    }
    tree.write(packageJsonPath, JSON.stringify(packageJsonContent, null, 2))
    logger.info('✅ Added Docker scripts to package.json')
  }
}

function ensureEnvInGitignore(tree: Tree) {
  const gitignorePath = '.gitignore'
  if (tree.exists(gitignorePath)) {
    let gitignoreContent = tree.read(gitignorePath, 'utf-8')
    if (!gitignoreContent.includes('.env')) {
      gitignoreContent += '\n.env\n'
      tree.write(gitignorePath, gitignoreContent)
      logger.info('✅ Added .env to .gitignore')
    } else {
      logger.info('ℹ️  .env already exists in .gitignore')
    }
  } else {
    tree.write(gitignorePath, '.env\n')
    logger.info('✅ Created .gitignore and added .env')
  }
}

function addNxScriptsToPackageJson(tree: Tree) {
  const nxScripts = {
    affected: 'nx affected',
    'affected:apps': 'nx affected:apps',
    'affected:build': 'nx affected:build',
    'affected:dep-graph': 'nx affected:dep-graph',
    'affected:e2e': 'nx affected:e2e',
    'affected:libs': 'nx affected:libs',
    'affected:lint': 'nx affected:lint',
    'affected:test': 'nx affected:test',
    'dep-graph': 'nx dep-graph',
    'build:api': 'nx build api --prod --skip-nx-cache',
    'dev:api': 'nx serve api --skip-nx-cache',
    format: 'nx format:write',
    'format:check': 'nx format:check',
    'format:write': 'nx format:write',
    help: 'nx help',
    lint: 'nx workspace-lint && nx lint',
    nx: 'nx',
    'pre-commit:lint': 'nx format:write --uncommitted & nx affected --target eslint --uncommitted',
    test: 'nx test',
    'test:api': 'pnpm nx e2e api-e2e',
    'test:ci': 'pnpm test:api',
    update: 'nx migrate latest',
    'workspace-generator': 'nx workspace-generator',
  }
  const packageJsonPath = 'package.json'
  if (tree.exists(packageJsonPath)) {
    const packageJsonContent = JSON.parse(tree.read(packageJsonPath, 'utf-8') || '{}')
    packageJsonContent.scripts = {
      ...packageJsonContent.scripts,
      ...nxScripts,
    }
    tree.write(packageJsonPath, JSON.stringify(packageJsonContent, null, 2))
    logger.info('✅ Added Nx-related scripts to package.json')
  }
}

export async function initConfigGenerator(tree: Tree): Promise<GeneratorCallback> {
  addDependenciesToPackageJson(tree, { '@prisma/internals': '^5.14.0' }, { yaml: '^2.4.2' })
  // Always handle Prettier configuration
  handlePrettierConfig(tree)

  // Always handle .env.example generation
  handleEnvExample(tree)

  // Always handle Docker files and scripts
  handleDockerFilesAndScripts(tree)

  // Remove the workspaces section from package.json if it exists
  removeWorkspacesFromPackageJson(tree)

  // Add the clean script to package.json
  addScriptToPackageJson(
    tree,
    'clean',
    'git reset --hard HEAD && git clean -fd && rm -rf node_modules && rm -rf tmp && rm -rf dist && rm -rf apps && rm -rf libs && pnpm install',
  )

  // Create or update pnpm-workspace.yaml
  updatePnpmWorkspaceConfig(tree, { packages: ['apps/**', 'libs/**', 'tools/*'] })

  // Always ensure .env is in .gitignore
  ensureEnvInGitignore(tree)

  // Always add Nx-related scripts
  addNxScriptsToPackageJson(tree)

  // Return a callback that will run after the generator completes
  return pnpmInstallCallback()
}

export default initConfigGenerator
