import { describe, expect, test } from 'vitest'
import { CachePump } from './cachePump.js'
import { Database } from '../operations/interfaces.js'
import AsyncGeneratorQueue from './asyncGeneratorQueue.js'
import { Item } from '../types/types.js'
import { DefermentManager } from './defermentManager.js'

const makeDatabase = (): Database =>
  ({
    cacheSaveBatch: async (): Promise<void> => {},
    getAll: async (): Promise<(Item | undefined)[]> => Promise.resolve([])
  } as unknown as Database)
const makeGathered = (): AsyncGeneratorQueue<Item> =>
  ({
    add: () => {},
    async *consume() {}
  } as unknown as AsyncGeneratorQueue<Item>)
const makeDeferments = (): DefermentManager =>
  ({
    undefer: () => {}
  } as unknown as DefermentManager)
describe('CachePump disposal', () => {
  test('disposeAsync is idempotent and always resolves', async () => {
    const pump = new CachePump(makeDatabase(), makeGathered(), makeDeferments(), {
      maxCacheWriteSize: 2,
      maxCacheBatchWriteWait: 100,
      maxCacheBatchReadWait: 1,
      maxWriteQueueSize: 2,
      maxCacheReadSize: 2
    })
    await pump.disposeAsync()
    await expect(pump.disposeAsync()).resolves.toBeUndefined()
  })

  test('should not throw on add after dispose if writeQueue was never created', async () => {
    const pump = new CachePump(makeDatabase(), makeGathered(), makeDeferments(), {
      maxCacheWriteSize: 2,
      maxCacheBatchWriteWait: 100,
      maxCacheBatchReadWait: 1,
      maxWriteQueueSize: 2,
      maxCacheReadSize: 2
    })
    await pump.disposeAsync()
    // Should not throw, but will not add anything
    expect(() =>
      pump.add({ baseId: 'a', base: { id: 'b', speckle_type: 'type' } })
    ).not.toThrow()
  })
})
