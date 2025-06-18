import { execSync } from 'node:child_process'
import { releasePublish, releaseVersion } from 'nx/release'
import { parseArgs } from 'node:util'

const validTypes = ['patch', 'minor', 'major'] as const
type ReleaseType = (typeof validTypes)[number]

async function main() {
  const {
    values: { type, skipPublish, firstRelease },
  } = parseArgs({
    options: {
      type: { type: 'string', short: 't' },
      skipPublish: { type: 'boolean', default: false },
      firstRelease: { type: 'boolean', default: false },
    },
    allowPositionals: true,
  })

  const specifier = (type ?? 'patch') as ReleaseType

  if (!validTypes.includes(specifier)) {
    console.error(`❌ Invalid release type: "${type}". Use one of: ${validTypes.join(', ')}`)
    process.exit(1)
  }

  console.log(`🛠  Releasing: type=${specifier}, skipPublish=${skipPublish}`)

  // ✅ Step 1: Build all affected publishable libraries
  console.log(`🔨 Building affected packages...`)
  execSync(`nx run-many --target=build --all`, { stdio: 'inherit' })

  // ✅ Step 2: Version
  await releaseVersion({
    specifier,
    firstRelease,
    stageChanges: true,
    gitCommit: true,
    gitTag: true,
    versionActionsOptionsOverrides: {
      skipLockFileUpdate: true,
    },
  })

  // ✅ Step 3: Publish
  if (!skipPublish) {
    await releasePublish({ firstRelease })
  } else {
    console.log(`📦 Skipping publish step`)
  }

  console.log(`✅ Release completed`)
}

main().catch((err) => {
  console.error('❌ Release failed', err)
  process.exit(1)
})
