import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ModuleKind, transpileModule } from 'typescript'

// Execute the emitted helper itself, including its timer/error behavior.
const source = readFileSync(join(__dirname, 'files/data-access/src/lib/retry-write.ts__tmpl__'), 'utf8')
const compiled = transpileModule(source, { compilerOptions: { module: ModuleKind.CommonJS } })
const generated = {} as { retryWrite: <T>(write: () => Promise<T>) => Promise<T> }
new Function('exports', compiled.outputText)(generated)

describe('generated standalone write retries', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('recreates the complete write after a rolled-back conflict', async () => {
    const write = vi
      .fn()
      .mockRejectedValueOnce({ code: 'P2034' })
      .mockRejectedValueOnce({ code: 'P2034' })
      .mockResolvedValue({ id: 'record-1' })
    const result = generated.retryWrite(write)
    expect(write).toHaveBeenCalledTimes(1)
    await vi.runAllTimersAsync()
    await expect(result).resolves.toEqual({ id: 'record-1' })
    expect(write).toHaveBeenCalledTimes(3)
  })

  it('stops after six attempts and preserves the last conflict', async () => {
    const conflict = { code: 'P2034' }
    const write = vi.fn().mockRejectedValue(conflict)
    const result = expect(generated.retryWrite(write)).rejects.toBe(conflict)
    await vi.runAllTimersAsync()
    await result
    expect(write).toHaveBeenCalledTimes(6)
  })

  it.each([{ code: 'P2002' }, { code: 'P2025' }, new Error('connection lost'), null])(
    'does not retry an error that does not guarantee rollback: %s',
    async (error) => {
      const write = vi.fn().mockRejectedValue(error)
      await expect(generated.retryWrite(write)).rejects.toBe(error)
      expect(write).toHaveBeenCalledTimes(1)
      expect(vi.getTimerCount()).toBe(0)
    },
  )
})
