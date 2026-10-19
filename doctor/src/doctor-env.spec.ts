import { describe, expect, it } from 'vitest'
import { readEnvValue } from './doctor-env'

describe('readEnvValue', () => {
  it('resolves a duplicated key to its last assignment, as docker compose does', () => {
    const env = 'API_PORT=3000\nWEB_PORT=4200\nAPI_PORT=3100\n'
    expect(readEnvValue(env, 'API_PORT')).toBe('3100')
  })

  it('lets a later empty assignment override an earlier value', () => {
    expect(readEnvValue('SMTP_HOST=localhost\nSMTP_HOST=\n', 'SMTP_HOST')).toBe('')
  })

  it('applies the parsing rules to the winning line only', () => {
    const env = 'URL="http://first"\nexport URL=\'http://last\' # override\n'
    expect(readEnvValue(env, 'URL')).toBe('http://last')
  })

  it('ignores commented-out reassignments', () => {
    expect(readEnvValue('API_PORT=3000\n# API_PORT=9999\n', 'API_PORT')).toBe('3000')
  })

  it('reads a single assignment unchanged', () => {
    expect(readEnvValue('API_PORT=3000\n', 'API_PORT')).toBe('3000')
  })

  it('returns empty for a missing key and does not match key prefixes', () => {
    expect(readEnvValue('API_PORT_EXTRA=1\n', 'API_PORT')).toBe('')
    expect(readEnvValue('', 'API_PORT')).toBe('')
  })

  it('strips surrounding quotes and keeps the quoted value verbatim', () => {
    expect(readEnvValue('A="a # not a comment"\n', 'A')).toBe('a # not a comment')
    expect(readEnvValue("A='single'\n", 'A')).toBe('single')
    expect(readEnvValue('A=""\n', 'A')).toBe('')
  })

  it('drops a comment after a closing quote', () => {
    expect(readEnvValue('A="quoted" # note\n', 'A')).toBe('quoted')
  })

  it('drops an unquoted inline comment', () => {
    expect(readEnvValue('A=value # note\n', 'A')).toBe('value')
    expect(readEnvValue('A=value\t# note\n', 'A')).toBe('value')
  })

  it('treats `KEY= # comment` as empty', () => {
    expect(readEnvValue('A= # note\n', 'A')).toBe('')
  })

  it('keeps a `#` that does not follow whitespace', () => {
    expect(readEnvValue('A=pa#ss\n', 'A')).toBe('pa#ss')
    expect(readEnvValue('A=#hash\n', 'A')).toBe('#hash')
  })

  it('accepts an `export ` prefix and leading whitespace', () => {
    expect(readEnvValue('export A=1\n', 'A')).toBe('1')
    expect(readEnvValue('  A=2\n', 'A')).toBe('2')
    expect(readEnvValue('exportA=3\n', 'A')).toBe('')
  })

  it('handles CRLF line endings', () => {
    expect(readEnvValue('A=1\r\nA="2"\r\n', 'A')).toBe('2')
  })
})
