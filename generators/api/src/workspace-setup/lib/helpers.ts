import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { basename } from 'path'
import { Client } from 'pg'
import { workspaceRoot } from '@nx/devkit'

export const MAX_RETRIES = 30
export const WORKSPACE_NAME = basename(process.cwd())
export const DATABASE_URL = process.env.DATABASE_URL
export const DOCKER_COMPOSE_FILE = '.dev/docker-compose.yml'

export function log(...msg) {
  console.log(`[${WORKSPACE_NAME}]`, ...msg)
}

export async function connectToPostgres(url: string): Promise<Client> {
  const client = new Client(url)
  await client.connect()
  return client
}

export async function canConnect(url: string): Promise<boolean> {
  try {
    await connectToPostgres(url)
    log('Connected to Postgres')
    return true
  } catch {
    return false
  }
}

export function ensureDockerIsRunning() {
  try {
    execSync('docker ps', { stdio: 'ignore' })
    log('Docker is Up')
    return true
  } catch {
    throw new Error(`Make sure Docker is running, then run this again`)
  }
}

export function isDockerComposeRunning(): boolean {
  try {
    const res = execSync('pnpm run docker:ps', { stdio: ['inherit', 'inherit'], cwd: workspaceRoot })
    if (res) {
      log('Docker Compose is Running')
      return true
    }
    return false
  } catch {
    return false
  }
}

export async function ensureDockerComposeIsRunning() {
  const isRunning = isDockerComposeRunning()
  if (isRunning) {
    log('Docker Compose already running')
    return true
  }

  log('Starting Docker Compose...')
  try {
    execSync('pnpm run docker:up', { stdio: 'inherit', cwd: workspaceRoot })
  } catch (e) {
    throw new Error(`Failed to start Docker Compose: ${e.message}`)
  }

  try {
    await waitForConnection()
    log('Docker Compose Started and DB connection confirmed')
  } catch {
    execSync('pnpm run docker:logs', { stdio: 'inherit', cwd: workspaceRoot })
    throw new Error(`Database failed to start or respond in time`)
  }
}

export function ensureDotEnv() {
  try {
    if (!existsSync('.env')) {
      writeFileSync('.env', readFileSync('.env.example'))
      log('.env created (copied from .env.example)')
    } else {
      log('.env exists')
    }
  } catch {
    throw new Error(`Error creating or reading.env file`)
  }
}

export function runPrismaSetup() {
  try {
    execSync('pnpm prisma:apply', { stdio: 'inherit', cwd: workspaceRoot })
    log('Prisma Setup is Done')
    return true
  } catch (e) {
    execSync('pnpm run docker:logs', { stdio: 'inherit', cwd: workspaceRoot })
    throw new Error(`There was an issue running 'pnpm prisma:apply': ${e.message}`)
  }
}

export function runPrismaSeed() {
  try {
    execSync('npx prisma db seed -- --confirm --timeout 0', { stdio: 'inherit' })
    log('Prisma Seed is Done')
    return true
  } catch (e) {
    console.error('Prisma Seed Error:', e.message)
    throw new Error(`There was an issue running 'pnpm prisma:seed': ${e.message}`)
  }
}

export function runGraphQLTypeGeneration() {
  try {
    execSync('pnpm generate:models', { stdio: 'inherit' })
    log('GraphQL types generation is done')
    return true
  } catch (e) {
    console.error('GraphQL types generation error:', e.message)
    throw new Error(`There was an issue running 'pnpm generate:models': ${e.message}`)
  }
}

export const sleep = (ms = 1000) => new Promise((resolve) => setTimeout(resolve, ms))

function waitForConnection(): Promise<void> {
  log('Waiting for Postgres to connect')
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
