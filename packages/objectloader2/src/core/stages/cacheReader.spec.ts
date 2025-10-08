import { describe, test, expect } from 'vitest'
import { DefermentManager } from '../../deferment/defermentManager.js'
import { Item, Base } from '../../types/types.js'
import { CacheReader } from './cacheReader.js'
import { MemoryDatabase } from './memory/memoryDatabase.js'
import { MemoryCache } from '../../deferment/MemoryCache.js'

describe('CacheReader testing', () => {
  test('deferred getObject', async () => {
    const i1: Item = { baseId: 'id1', base: { id: 'id', speckle_type: 'type' } }

    const cache = new MemoryCache({ maxSizeInMb: 1, ttlms: 1 }, () => {})
    const deferments = new DefermentManager(() => {}, cache)
    const cacheReader = new CacheReader(
      new MemoryDatabase({
        items: new Map<string, Base>([[i1.baseId, i1.base!]])
      }),
      deferments,
      () => {},
      {
        maxCacheReadSize: 1,
        maxCacheWriteSize: 1,
        maxCacheBatchWriteWait: 1,
        maxCacheBatchReadWait: 1,
        maxWriteQueueSize: 1
      }
    )

    const objPromise = cacheReader.getObject({
      id: i1.baseId
    })
    deferments.undefer(i1, (id: string) => {
      throw new Error(`Requesting item ${id} not implemented`)
    })
    const base = await objPromise

    expect(base).toMatchSnapshot()
    await cacheReader.disposeAsync()
  })
})
