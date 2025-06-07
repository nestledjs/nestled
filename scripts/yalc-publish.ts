// scripts/manage-lib.ts
import { execSync } from 'child_process'
import { resolve } from 'path'

const [, , action, libName] = process.argv

if (!action || !libName) {
  console.error('❌ Usage: pnpm push <lib> or pnpm publish <lib>')
  process.exit(1)
}

console.log('🔧 Running pnpm build to ensure dist is up to date...')
execSync('pnpm build', { stdio: 'inherit' })

const distPath = resolve(__dirname, `../dist/${libName}`)

const command =
  action === 'push' ? `cd ${distPath} && yalc push` : action === 'publish' ? `cd ${distPath} && yalc publish` : null

if (!command) {
  console.error(`❌ Unknown action: ${action}`)
  process.exit(1)
}

console.log(`📦 Running "${action}" for ${libName} from ${distPath}`)
execSync(command, { stdio: 'inherit' })
