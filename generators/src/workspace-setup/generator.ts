require('dotenv').config()
import {
  canConnect,
  ensureDockerComposeIsRunning,
  ensureDockerIsRunning,
  ensureDotEnv,
  log,
  runPrismaSeed,
  runPrismaSetup,
  runGraphQLTypeGeneration,
} from './lib/helpers'

export default async function () {
  log('Setting up workspace ')

  ensureDotEnv()
  require('dotenv').config()
  
  const DATABASE_URL = process.env.DATABASE_URL

  if (!DATABASE_URL) {
    throw new Error(`Please provide DATABASE_URL env var`)
  }

  if (!DATABASE_URL.includes('localhost')) {
    throw new Error(`Can't connect to DATABASE_URL if it's not on localhost`)
  }

  const connected = await canConnect(DATABASE_URL)

  if (!connected) {
    ensureDockerIsRunning()
    await ensureDockerComposeIsRunning()
  }

  try {
    runPrismaSetup()
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Generate GraphQL types from Prisma schema
    log('Generating GraphQL types from Prisma schema...')
    runGraphQLTypeGeneration()
    
    runPrismaSeed()
    log('Workspace setup done!')
  } catch (error) {
    console.error('Error during workspace setup:', error.message)
  }
}
