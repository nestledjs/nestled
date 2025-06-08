import { Tree } from '@nx/devkit'

export async function infoGenerator(tree: Tree) {
  // Create setup.md file with generator commands
  const setupContent = `# Setup Instructions

Run the following commands in order to set up your project:

\`\`\`sh
nx g @nestled/generators:api-dependencies
\`\`\`
> Note: This will automatically run \`pnpm install\` to install all dependencies.
> It will also set up Nx packages to version 21.1.3 for compatibility.

\`\`\`sh
nx g @nestled/generators:api-app
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

export default infoGenerator
