import { describe, expect, test } from 'vitest'
import { CachePump } from './cachePump.js'
import { Item } from '../types/types.js'
import BufferQueue from './bufferQueue.js'
import { Database } from '../operations/indexedDatabase.js'
import AsyncGeneratorQueue from './asyncGeneratorQueue.js'
import { DefermentManager } from './defermentManager.js'

class MockDatabase implements Database {
  private items: Map<string, Item>

  constructor(items?: Map<string, Item>) {
    this.items = items || new Map<string, Item>()
  }

  getAll(keys: string[]): Promise<(Item | undefined)[]> {
    const found: (Item | undefined)[] = []
    for (const key of keys) {
      found.push(this.items.get(key))
    }
    return Promise.resolve(found)
  }

  cacheSaveBatch({ batch }: { batch: Item[] }): Promise<void> {
    for (const item of batch) {
      this.items.set(item.baseId, item)
    }
    return Promise.resolve()
  }

  getItem({ id }: { id: string }): Promise<Item | undefined> {
    return Promise.resolve(this.items.get(id))
  }

  disposeAsync(): Promise<void> {
    return Promise.resolve()
  }
}

describe('CachePump testing', () => {
  test('write two items to queue use pumpItems that are NOT found', async () => {
    const i1: Item = { baseId: 'id1', base: { id: 'id', speckle_type: 'type' } }
    const i2: Item = { baseId: 'id2', base: { id: 'id', speckle_type: 'type' } }

    const gathered = new AsyncGeneratorQueue<Item>()
    const deferments = new DefermentManager({maxSize: 1, ttl: 1})
    const cachePump = new CachePump(new MockDatabase(), gathered, deferments, {
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

     const db = new Map<string, Item>();
     db.set(i1.baseId, i1)
     db.set(i2.baseId, i2)

     const gathered = new AsyncGeneratorQueue<Item>()
     const deferments = new DefermentManager({ maxSize: 1, ttl: 1 })
     const cachePump = new CachePump(new MockDatabase(db), gathered, deferments, {
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
})
