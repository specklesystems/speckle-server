import { describe, test, expect, beforeEach } from 'vitest'
import { DefermentManager } from './defermentManager.js'
import { DefermentManagerOptions } from '../operations/options.js'
import { Base, Item } from '../types/types.js'

const makeItem = (id: string, size = 1): Item => ({
  baseId: id,
  base: { foo: 'bar' } as unknown as Base,
  size
})

describe('DefermentManager totalDefermentRequests', () => {
  let manager: DefermentManager
  let options: DefermentManagerOptions

  beforeEach(() => {
    options = { maxSizeInMb: 1, ttlms: 1000, logger: (): void => {} }
    manager = new DefermentManager(options)
  })

  test('tracks deferment requests for each id', () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    manager.defer({ id: 'a' })
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    manager.defer({ id: 'a' })
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    manager.defer({ id: 'b' })
    // @ts-expect-error: access private for test
    expect(manager.totalDefermentRequests.get('a')).toBe(2)
    // @ts-expect-error: access private for test
    expect(manager.totalDefermentRequests.get('b')).toBe(1)
  })

  test('increments and does not reset on undefer', () => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    manager.defer({ id: 'x' })
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    manager.defer({ id: 'x' })
    manager.undefer(makeItem('x'))
    // @ts-expect-error: access private for test
    expect(manager.totalDefermentRequests.get('x')).toBe(2)
    // @ts-expect-error: access private for test
    const deferredBase = manager.deferments.get('x')
    expect(deferredBase).toBeDefined()
    expect(deferredBase?.getId()).toBe('x')
  })

  test('does not increment for undefer only', () => {
    manager.undefer(makeItem('y'))
    // @ts-expect-error: access private for test
    expect(manager.totalDefermentRequests.get('y')).toBeUndefined()
  })
})
