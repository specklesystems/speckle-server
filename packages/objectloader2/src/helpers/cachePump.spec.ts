import { describe, expect, test } from 'vitest'
import { CachePump } from './cachePump.js'
import { Base, Item } from '../types/types.js'
import BufferQueue from './bufferQueue.js'
import AsyncGeneratorQueue from './asyncGeneratorQueue.js'
import { DefermentManager } from './defermentManager.js'
import { MemoryDatabase } from '../operations/databases/memoryDatabase.js'
import { Database } from '../operations/interfaces.js'

describe('CachePump testing', () => {
  test('write two items to queue use pumpItems that are NOT found', async () => {
    const i1: Item = { baseId: 'id1', base: { id: 'id', speckle_type: 'type' } }
    const i2: Item = { baseId: 'id2', base: { id: 'id', speckle_type: 'type' } }

    const gathered = new AsyncGeneratorQueue<Item>()
    const deferments = new DefermentManager({ maxSizeInMb: 1, ttlms: 1 })
    const cachePump = new CachePump(new MemoryDatabase({}), gathered, deferments, {
      maxCacheReadSize: 1,
      maxCacheWriteSize: 1,
      maxCacheBatchWriteWait: 1,
      maxCacheBatchReadWait: 1,
      maxWriteQueueSize: 1
    })

    const foundItems = new BufferQueue<Item>()
    const notFoundItems = new BufferQueue<string>()

    await cachePump.pumpItems({
      ids: [i1.baseId, i2.baseId],
      foundItems,
      notFoundItems
    })

    expect(foundItems.values()).toMatchSnapshot()
    expect(notFoundItems.values()).toMatchSnapshot()
    await cachePump.disposeAsync()
  })

  test('write two items to queue use pumpItems that are found', async () => {
    const i1: Item = { baseId: 'id1', base: { id: 'id', speckle_type: 'type' } }
    const i2: Item = { baseId: 'id2', base: { id: 'id', speckle_type: 'type' } }

    const db = new Map<string, Base>()
    db.set(i1.baseId, i1.base)
    db.set(i2.baseId, i2.base)

    const gathered = new AsyncGeneratorQueue<Item>()
    const deferments = new DefermentManager({ maxSizeInMb: 1, ttlms: 1 })
    const cachePump = new CachePump(
      new MemoryDatabase({ items: db }),
      gathered,
      deferments,
      {
        maxCacheReadSize: 1,
        maxCacheWriteSize: 1,
        maxCacheBatchWriteWait: 1,
        maxCacheBatchReadWait: 1,
        maxWriteQueueSize: 1
      }
    )

    const foundItems = new BufferQueue<Item>()
    const notFoundItems = new BufferQueue<string>()

    await cachePump.pumpItems({
      ids: [i1.baseId, i2.baseId],
      foundItems,
      notFoundItems
    })

    expect(foundItems.values()).toMatchSnapshot()
    expect(notFoundItems.values()).toMatchSnapshot()
    await cachePump.disposeAsync()
  })

  test('can dispose while waiting and not wait', async () => {
    const i1: Item = { baseId: 'id1', base: { id: 'id', speckle_type: 'type' } }
    const i2: Item = { baseId: 'id2', base: { id: 'id', speckle_type: 'type' } }

    const db: Database = {
      getAll: async () => Promise.resolve([])
    } as unknown as Database
    const gathered = new AsyncGeneratorQueue<Item>()
    const deferments = new DefermentManager({ maxSizeInMb: 1, ttlms: 1 })
    const cachePump = new CachePump(db, gathered, deferments, {
      maxCacheReadSize: 1,
      maxCacheWriteSize: 1,
      maxCacheBatchWriteWait: 1,
      maxCacheBatchReadWait: 1,
      maxWriteQueueSize: 1
    })

    const foundItems = new BufferQueue<Item>()
    const notFoundItems = new BufferQueue<string>()

    await cachePump.disposeAsync()
    await cachePump.pumpItems({
      ids: [i1.baseId, i2.baseId],
      foundItems,
      notFoundItems
    })
  })
})
