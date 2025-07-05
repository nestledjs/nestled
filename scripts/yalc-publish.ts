import { execSync } from 'child_process'
import { resolve } from 'path'
import { existsSync } from 'fs'

// Define dependency order - dependencies first, dependents last
const DEPENDENCY_ORDER = ['helpers', 'utils', 'shared', 'plugins', 'config', 'web', 'api', 'forms']

async function main() {
  const [, , action, libName] = process.argv

  if (!action) {
    console.error('❌ Usage: pnpm publish-all or pnpm push <lib> or pnpm push-all')
    process.exit(1)
  }

  if (action === 'publish-all' || action === 'push-all') {
    // Publish/push all packages in dependency order
    const baseAction = action === 'publish-all' ? 'publish' : 'push'
    for (const lib of DEPENDENCY_ORDER) {
      await processPackage(baseAction, lib)
    }
    return
  }

  if (action === 'push') {
    if (!libName) {
      console.error('❌ Usage: pnpm push <lib>')
      process.exit(1)
    }
    await processPackage('push', libName)
    return
  }

  console.error(`❌ Unknown action: ${action}`)
  process.exit(1)
}

async function processPackage(action, libName) {
  console.log(`\n🚀 Processing ${libName}...`)

  console.log('🔧 Building with dependencies...')
  try {
    execSync(
      `pnpm nx run-many --target=build --projects=${libName} --with-deps --skip-nx-cache --no-daemon --output-style=static`,
      { stdio: 'inherit' },
    )
  } catch (e) {
    console.error(`🚨 Build failed for ${libName}:`, e)
    process.exit(1)
  }

  // Determine correct dist path
  let distPath = resolve(__dirname, `../dist/generators/${libName}`)
  if (!existsSync(distPath)) {
    distPath = resolve(__dirname, `../dist/${libName}`)
    if (!existsSync(distPath)) {
      console.error(`❌ Could not find dist directory for ${libName} in either dist/generators/ or dist/`)
      process.exit(1)
    }
  }

  const command = `cd ${distPath} && yalc ${action}`

  console.log(`📦 Running "yalc ${action}" for ${libName} from ${distPath}`)
  execSync(command, { stdio: 'inherit' })
}

main().catch((err) => {
  console.error('🚨 Script failed:', err)
  process.exit(1)
})
