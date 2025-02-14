require('dotenv').config()
import chalk from 'chalk'
import {
  canConnect,
  DATABASE_URL,
  ensureDockerComposeIsRunning,
  ensureDockerIsRunning,
  ensureDotEnv,
  log,
  runPrismaSeed,
  runPrismaSetup,
} from './lib/helpers'

export default async function () {
  log(chalk.blueBright('Setting up workspace '))

  await ensureDotEnv()

  if (!DATABASE_URL) {
    throw new Error(`Please provide DATABASE_URL env var`)
  }

  if (!DATABASE_URL.includes('localhost')) {
    throw new Error(`Can't connect to DATABASE_URL if it's not on localhost`)
  }

  const connected = await canConnect(DATABASE_URL)

  if (!connected) {
    await ensureDockerIsRunning()
    await ensureDockerComposeIsRunning()
  }

  try {
    runPrismaSetup()
    runPrismaSeed()
    log(chalk.blueBright('Workspace setup done!'))
  } catch (error) {
    console.error('Error during workspace setup:', error.message)
  }
}
