import { vi, describe, it, expect, beforeEach } from 'vitest'

const {
  canConnect,
  ensureDockerComposeIsRunning,
  ensureDockerIsRunning,
  ensureDotEnv,
  log,
  runPrismaSeed,
  runPrismaSetup,
  runGraphQLTypeGeneration,
  sleep,
} = vi.hoisted(() => {
  return {
    canConnect: vi.fn(),
    ensureDockerComposeIsRunning: vi.fn(),
    ensureDockerIsRunning: vi.fn(),
    ensureDotEnv: vi.fn(),
    log: vi.fn(),
    runPrismaSeed: vi.fn(),
    runPrismaSetup: vi.fn(),
    runGraphQLTypeGeneration: vi.fn(),
    sleep: vi.fn(),
  }
})

vi.mock('./lib/helpers', () => ({
  canConnect,
  ensureDockerComposeIsRunning,
  ensureDockerIsRunning,
  ensureDotEnv,
  log,
  runPrismaSeed,
  runPrismaSetup,
  runGraphQLTypeGeneration,
  sleep,
}))

import generator from './generator'

describe('workspace-setup generator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.DATABASE_URL
  })

  it('should throw an error if DATABASE_URL is not provided', async () => {
    await expect(generator()).rejects.toThrow('Please provide DATABASE_URL env var')
  })

  it('should throw an error if DATABASE_URL is not on localhost', async () => {
    process.env.DATABASE_URL = 'some-remote-db'
    await expect(generator()).rejects.toThrow("Refusing to connect to non-local database: some-remote-db")
  })

  it('should run setup without docker if already connected', async () => {
    process.env.DATABASE_URL = 'localhost:5432'
    canConnect.mockResolvedValue(true)

    await generator()

    expect(ensureDotEnv).toHaveBeenCalled()
    expect(canConnect).toHaveBeenCalledWith('localhost:5432')
    expect(ensureDockerIsRunning).toHaveBeenCalled()
    expect(ensureDockerComposeIsRunning).not.toHaveBeenCalled()
    expect(runPrismaSetup).toHaveBeenCalled()
    expect(runGraphQLTypeGeneration).toHaveBeenCalled()
    expect(runPrismaSeed).toHaveBeenCalled()
  })

  it('should start docker and run setup if not connected', async () => {
    process.env.DATABASE_URL = 'localhost:5432'
    canConnect.mockResolvedValue(false)

    await generator()

    expect(ensureDotEnv).toHaveBeenCalled()
    expect(canConnect).toHaveBeenCalledWith('localhost:5432')
    expect(ensureDockerIsRunning).toHaveBeenCalled()
    expect(ensureDockerComposeIsRunning).toHaveBeenCalled()
    expect(runPrismaSetup).toHaveBeenCalled()
    expect(runGraphQLTypeGeneration).toHaveBeenCalled()
    expect(runPrismaSeed).toHaveBeenCalled()
  })
})
