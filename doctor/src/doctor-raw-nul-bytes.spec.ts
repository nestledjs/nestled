import { describe, expect, it } from 'vitest'
import { findRawNulLines, RAW_NUL_SOURCE_PATTERN } from './doctor-raw-nul-bytes'

describe('findRawNulLines', () => {
  it('reports the line of every raw NUL byte', () => {
    const source = Buffer.from(`const ok = 1\nconst key = 'a\u0000b'\nconst other = 2\nconst again = '\u0000'\n`)
    expect(findRawNulLines(source)).toEqual([2, 4])
  })

  it('accepts the escaped form, which is the fix', () => {
    expect(findRawNulLines(Buffer.from('const key = `a\\x00b`\n'))).toEqual([])
  })
})

describe('RAW_NUL_SOURCE_PATTERN', () => {
  it('covers source, config and snapshot files, but not binary assets', () => {
    for (const file of [
      'a.ts',
      'a.tsx',
      'a.mjs',
      'a.json',
      'schema.prisma',
      'q.graphql',
      'README.md',
      'x.spec.ts.snap',
    ]) {
      expect(RAW_NUL_SOURCE_PATTERN.test(file)).toBe(true)
    }
    for (const file of ['logo.png', 'font.woff2', 'archive.zip']) {
      expect(RAW_NUL_SOURCE_PATTERN.test(file)).toBe(false)
    }
  })
})
