import { execSync } from 'child_process'
import { resolve } from 'path'

async function main() {
  const [, , action, libName] = process.argv

  if (!action || !libName) {
    console.error('❌ Usage: pnpm push <lib> or pnpm publish <lib>')
    process.exit(1)
  }

  console.log('🗺️ Generating Nx project graph...')
  execSync('pnpm nx graph --file=tmp.html --no-interactive --no-daemon', { stdio: 'inherit' })

  console.log('🔧 Building with dependencies...')
  try {
    execSync(`pnpm nx run-many --target=build --projects=${libName} --with-deps --skip-nx-cache --no-daemon --output-style=static`, { stdio: 'inherit' })
  } catch (e) {
    console.error('🚨 Build failed:', e)
    process.exit(1)
  }

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
