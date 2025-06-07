// scripts/manage-lib.ts
import { execSync } from 'child_process'
import { resolve } from 'path'
import { createProjectGraphAsync } from 'nx/src/project-graph/project-graph'

async function main() {
  const [, , action, libName] = process.argv

  if (!action || !libName) {
    console.error('❌ Usage: pnpm push <lib> or pnpm publish <lib>')
    process.exit(1)
  }

  console.log('📡 Warming up Nx ProjectGraph...')
  await createProjectGraphAsync()

  console.log('🔧 Running pnpm build to ensure dist is up to date...')
  execSync(`nx build ${libName} --skip-nx-cache`, { stdio: 'inherit' })

  const distPath = resolve(__dirname, `../dist/generators/${libName}`)

  const command =
    action === 'push' ? `cd ${distPath} && yalc push` : action === 'publish' ? `cd ${distPath} && yalc publish` : null

  if (!command) {
    console.error(`❌ Unknown action: ${action}`)
    process.exit(1)
  }

  console.log(`📦 Running "${action}" for ${libName} from ${distPath}`)
  execSync(command, { stdio: 'inherit' })
}

main().catch((err) => {
  console.error('🚨 Script failed:', err)
  process.exit(1)
})
