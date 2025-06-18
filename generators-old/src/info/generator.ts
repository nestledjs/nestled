import { Tree } from '@nx/devkit'

export async function infoGenerator(tree: Tree) {
  // Create setup.md file with generator commands
  const setupContent = `# Setup Instructions

Run the following commands in order to set up your project:

\`\`\`sh
nx g @nestledjs/generators:api-dependencies
\`\`\`
> Note: This will automatically run \`pnpm install\` to install all dependencies.
> It will also set up Nx packages to version 21.2.0 for compatibility.

\`\`\`sh
nx g @nestledjs/generators:api-app
\`\`\`

\`\`\`sh
nx g @nestledjs/generators:api-libs
\`\`\`

\`\`\`sh
nx g @nestledjs/generators:project-config
\`\`\`

\`\`\`sh
nx g @nestledjs/generators:workspace-setup
\`\`\`
`

  tree.write('setup.md', setupContent)
}

export default infoGenerator
