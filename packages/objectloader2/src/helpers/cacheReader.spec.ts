import { describe, expect, test } from 'vitest'
import { Base, Item } from '../types/types.js'
import { DefermentManager } from './defermentManager.js'
import { CacheReader } from './cacheReader.js'
import { MemoryDatabase } from '../operations/databases/memoryDatabase.js'

describe('CacheReader testing', () => {
  test('deferred getObject', async () => {
    const i1: Item = { baseId: 'id1', base: { id: 'id', speckle_type: 'type' } }

    const deferments = new DefermentManager({ maxSizeInMb: 1, ttlms: 1 })
    const cacheReader = new CacheReader(
      new MemoryDatabase({
        items: new Map<string, Base>([[i1.baseId, i1.base]])
      }),
      deferments,
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
    deferments.undefer(i1)
    const base = await objPromise

    expect(base).toMatchSnapshot()
    await cacheReader.disposeAsync()
  })
})
