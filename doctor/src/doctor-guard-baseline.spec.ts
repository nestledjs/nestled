import { describe, expect, it } from 'vitest'
import { guardOperationSelections, mergeGuardBaseline, missingGuardOperations } from './doctor-guard-baseline'

const baseline = { 'user.resolver.ts': { me: ['GqlAuthGuard'], admin: ['GqlAuthAdminGuard'], removed: [] } }
const current = {
  'user.resolver.ts': { me: [], admin: ['GqlAuthAdminGuard'], added: [] },
  'new.controller.ts': { ping: [] },
}

describe('guard baseline coverage and scoped updates', () => {
  it('reports new operations even when deliberately public, including a completely new file', () => {
    expect(missingGuardOperations(baseline, current)).toEqual([
      { file: 'user.resolver.ts', method: 'added' },
      { file: 'new.controller.ts', method: 'ping' },
    ])
  })
  it('adds/removes only the selected entries without absorbing an unrelated guard downgrade', () => {
    const result = mergeGuardBaseline(baseline, current, [
      'user.resolver.ts::added',
      'user.resolver.ts::removed',
      'new.controller.ts::ping',
    ])
    expect(result).toEqual({
      'user.resolver.ts': { me: ['GqlAuthGuard'], admin: ['GqlAuthAdminGuard'], added: [] },
      'new.controller.ts': { ping: [] },
    })
    expect(baseline['user.resolver.ts'].removed).toEqual([])
  })
  it('updates reviewed existing guards explicitly and retains the full update command', () => {
    expect(mergeGuardBaseline(baseline, current, ['user.resolver.ts::me'])['user.resolver.ts'].me).toEqual([])
    expect(mergeGuardBaseline(baseline, current, [])).toEqual(current)
    expect(mergeGuardBaseline({ 'old.ts': { gone: [] } }, {}, ['old.ts::gone'])).toEqual({})
  })
  it('rejects invalid selections without mutating the original baseline', () => {
    for (const selection of ['missing.ts::missing', 'user.resolver.ts', '::me', 'user.resolver.ts::me::extra']) {
      expect(() => mergeGuardBaseline(baseline, current, ['user.resolver.ts::me', selection])).toThrow()
      expect(baseline['user.resolver.ts'].me).toEqual(['GqlAuthGuard'])
    }
  })
  it('requires explicit update mode and accepts repeated operation selections', () => {
    expect(
      guardOperationSelections([
        '--update-guard-baseline',
        '--guard-operation',
        'a.ts::one',
        '--guard-operation',
        'b.ts::two',
      ]),
    ).toEqual(['a.ts::one', 'b.ts::two'])
    for (const args of [['--guard-operation'], ['--guard-operation', '--full'], ['--guard-operation', 'a.ts::one']]) {
      expect(() => guardOperationSelections(args)).toThrow()
    }
  })
})
