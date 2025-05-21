import { describe, it, expect } from 'vitest'
import { DefermentManager } from './defermentManager.js'
import { DefermentManagerOptions } from '../operations/options.js'
import { Item } from '../types/types.js'

describe('DefermentManager disposal', () => {
  const options: DefermentManagerOptions = { ttlms: 10, maxSizeInMb: 1 }
  const makeItem = (id: string): Item => ({
    baseId: id,
    base: { id, speckle_type: 'test' }
  })

  it('should throw on get/defer/undefer after dispose', async () => {
    const manager = new DefermentManager(options)
    manager.dispose()
    expect(() => manager.get('a')).toThrow('DefermentManager is disposed')
    expect(() => manager.undefer(makeItem('a'))).toThrow('DefermentManager is disposed')
    await expect(manager.defer({ id: 'a' })).rejects.toThrow(
      'DefermentManager is disposed'
    )
  })

  it('dispose is idempotent', () => {
    const manager = new DefermentManager(options)
    manager.dispose()
    expect(() => manager.dispose()).not.toThrow()
  })
})
