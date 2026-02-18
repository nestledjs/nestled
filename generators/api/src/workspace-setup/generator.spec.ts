import { vi, describe, it, expect, beforeEach } from 'vitest'

const {
  canConnect,
  ensureDockerComposeIsRunning,
  ensureDockerIsRunning,
  ensureDotEnv,
  log,
  renameProject,
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
    renameProject: vi.fn(),
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
  renameProject,
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
    await expect(generator(null, { name: 'my-project' })).rejects.toThrow('Please provide DATABASE_URL env var')
  })

  it('should throw an error if DATABASE_URL is not on localhost', async () => {
    process.env.DATABASE_URL = 'some-remote-db'
    await expect(generator(null, { name: 'my-project' })).rejects.toThrow(
      'Refusing to connect to non-local database: some-remote-db',
    )
  })

  it('should rename the project as the first step', async () => {
    process.env.DATABASE_URL = 'localhost:5432'
    canConnect.mockResolvedValue(true)

    await generator(null, { name: 'my-cool-app' })

    expect(renameProject).toHaveBeenCalledWith('my-cool-app')
    // Rename should be called before other setup steps
    expect(renameProject).toHaveBeenCalledBefore(ensureDotEnv)
  })

  it('should run setup without docker if already connected', async () => {
    process.env.DATABASE_URL = 'localhost:5432'
    canConnect.mockResolvedValue(true)

    await generator(null, { name: 'my-project' })

    expect(renameProject).toHaveBeenCalledWith('my-project')
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

    await generator(null, { name: 'my-project' })

    expect(renameProject).toHaveBeenCalledWith('my-project')
    expect(ensureDotEnv).toHaveBeenCalled()
    expect(canConnect).toHaveBeenCalledWith('localhost:5432')
    expect(ensureDockerIsRunning).toHaveBeenCalled()
    expect(ensureDockerComposeIsRunning).toHaveBeenCalled()
    expect(runPrismaSetup).toHaveBeenCalled()
    expect(runGraphQLTypeGeneration).toHaveBeenCalled()
    expect(runPrismaSeed).toHaveBeenCalled()
  })
})
