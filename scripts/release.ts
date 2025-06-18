#!/usr/bin/env ts-node

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

  await releaseVersion({
    specifier,
    firstRelease,
    stageChanges: true,
    gitCommit: true,
    gitTag: true,
    versionActionsOptionsOverrides: {
      skipLockFileUpdate: true, // ✅ Always skip lockfile update
    },
  })

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
