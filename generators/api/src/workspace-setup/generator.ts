require('dotenv').config()
import {
  canConnect,
  ensureDockerComposeIsRunning,
  ensureDockerIsRunning,
  ensureDotEnv,
  log,
  runGraphQLTypeGeneration,
  runPrismaSeed,
  runPrismaSetup,
  sleep,
} from './lib/helpers'

export default async function () {
  log('Setting up workspace')

  ensureDotEnv()
  require('dotenv').config()

  const DATABASE_URL = process.env.DATABASE_URL

  if (!DATABASE_URL) {
    throw new Error('Please provide DATABASE_URL env var')
  }

  if (!DATABASE_URL.includes('localhost')) {
    throw new Error(`Refusing to connect to non-local database: ${DATABASE_URL}`)
  }

  ensureDockerIsRunning()

  const connected = await canConnect(DATABASE_URL)

  if (!connected) {
    await ensureDockerComposeIsRunning()
    // Extra safety delay — DB might show "healthy" before accepting connections
    await sleep(2000)
  }

  try {
    log('Applying Prisma migrations...')
    runPrismaSetup()

    await sleep(2000)

    log('Generating GraphQL types from Prisma schema...')
    runGraphQLTypeGeneration()

    log('Seeding database...')
    runPrismaSeed()

    log('✅ Workspace setup complete')
  } catch (error) {
    console.error('❌ Error during workspace setup:', error.message)
    process.exit(1)
  }
}
