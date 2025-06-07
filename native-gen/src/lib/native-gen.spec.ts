import { nativeGen } from './native-gen'

describe('nativeGen', () => {
  it('should work', () => {
    expect(nativeGen()).toEqual('native-gen')
  })
})
