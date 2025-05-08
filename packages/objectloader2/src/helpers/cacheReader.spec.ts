import { describe, expect, test } from 'vitest'
import { Item } from '../types/types.js'
import { Database } from '../operations/indexedDatabase.js'
import { DefermentManager } from './defermentManager.js'
import { CacheReader } from './cacheReader.js'

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

describe('CacheReader testing', () => {
  test('deferred getObject', async () => {
    const i1: Item = { baseId: 'id1', base: { id: 'id', speckle_type: 'type' } }

    const deferments = new DefermentManager({ maxSize: 1, ttl: 1 })
    const cacheReader = new CacheReader(new MockDatabase(), deferments, {
      maxCacheReadSize: 1,
      maxCacheWriteSize: 1,
      maxCacheBatchWriteWait: 1,
      maxCacheBatchReadWait: 1,
      maxWriteQueueSize: 1
    })


    const objPromise = cacheReader.getObject({
      id: i1.baseId
    })
    deferments.undefer(i1)
    const base = await objPromise

    expect(base).toMatchSnapshot()
    await cacheReader.disposeAsync()
  })
})
