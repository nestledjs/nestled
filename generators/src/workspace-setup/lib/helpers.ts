import chalk from 'chalk'
import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { basename } from 'path'
import { Client } from 'pg'

export const MAX_RETRIES = 30
export const WORKSPACE_NAME = basename(process.cwd())
export const DATABASE_URL = process.env.DATABASE_URL

export function log(...msg) {
  console.log(
    chalk.magentaBright('>'),
    chalk.inverse(chalk.magentaBright(chalk.bold(` BIZTOBIZ `))),
    chalk.gray(`${WORKSPACE_NAME}`),
    ...msg,
  )
}

export async function connectToPostgres(url: string): Promise<Client> {
  const client = new Client(url)
  await client.connect()
  return client
}

export async function canConnect(url: string): Promise<boolean> {
  try {
    await connectToPostgres(url)
    log(chalk.greenBright('Connected to Postgres'))
    return true
  } catch (e) {
    return false
  }
}

export function ensureDockerIsRunning() {
  try {
    execSync('docker ps', { stdio: 'ignore' })
    log(chalk.greenBright('Docker is Up'))
    return true
  } catch (e) {
    throw new Error(`Make sure Docker is running`)
  }
}

export function isDockerComposeRunning(): boolean {
  try {
    const res = execSync('docker compose top', {
      stdio: ['inherit', 'inherit'],
    })

    if (res) {
      log(chalk.greenBright('Docker Compose is Running'))
      return true
    }
    return false
  } catch (e) {
    return false
  }
}

export async function ensureDockerComposeIsRunning() {
  const isRunning = isDockerComposeRunning()
  if (isRunning) {
    return true
  }

  try {
    execSync('docker compose up -d', { stdio: 'ignore' })
    await waitForConnection()
    log(chalk.greenBright('Docker Compose Started'))
  } catch (e) {
    throw new Error(`Make sure Docker Compose is running`)
  }
}

export function ensureDotEnv() {
  // TODO: This method should verify if all values from .env.example exist in .env
  try {
    if (!existsSync('.env')) {
      writeFileSync('.env', readFileSync('.env.example'))
      log(chalk.greenBright('.env created (copied from .env.example)'))
    } else {
      log(chalk.greenBright('.env exists'))
    }
  } catch (e) {
    throw new Error(`Make sure Docker Compose is running`)
  }
}

export function runPrismaSetup() {
  try {
    execSync('pnpm prisma:db-push', { stdio: 'ignore' })
    log(chalk.greenBright('Prisma Setup is Done'))
    return true
  } catch (e) {
    throw new Error(`There was an issue running 'pnpm prisma:db-push'`)
  }
}

export function runPrismaSeed() {
  try {
    execSync('pnpm prisma:seed --confirm --timeout 0', { stdio: 'ignore' })
    log(chalk.greenBright('Prisma Seed is Done'))
    return true
  } catch (e) {
    throw new Error(`There was an issue running 'pnpm prisma:seed'`)
  }
}

export const sleep = (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms))

function waitForConnection(): Promise<void> {
  log(chalk.yellow('Waiting for Postgres to connect'))
  return new Promise((resolve, reject) => {
    let count = 0

    function tryConnect() {
      if (count >= MAX_RETRIES) {
        reject()
        return
      }

      canConnect(DATABASE_URL).then((isConnected) => {
        if (isConnected) {
          resolve()
        } else {
          count++
          sleep().then(tryConnect)
        }
      })
    }

    tryConnect()
  })
}
