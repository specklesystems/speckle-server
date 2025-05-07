/* eslint-disable @typescript-eslint/no-unsafe-call */
import { describe, expect, test } from 'vitest'
import IndexedDatabase from './indexedDatabase.js'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import { Item } from '../types/types.js'
import BufferQueue from '../helpers/bufferQueue.js'

describe('database cache', () => {
  test('write single item to queue use getItem', async () => {
    const i: Item = { baseId: 'id', base: { id: 'id', speckle_type: 'type' } }
    const database = new IndexedDatabase({
      indexedDB: new IDBFactory(),
      keyRange: IDBKeyRange,
      maxCacheBatchWriteWait: 200
    })
    await database.add(i)
    await database.disposeAsync()

    const x = await database.getItem({ id: 'id' })
    expect(x).toMatchSnapshot()
  })

  test('write two items to queue use getItem', async () => {
    const i1: Item = { baseId: 'id1', base: { id: 'id', speckle_type: 'type' } }
    const i2: Item = { baseId: 'id2', base: { id: 'id', speckle_type: 'type' } }
    const database = new IndexedDatabase({
      indexedDB: new IDBFactory(),
      keyRange: IDBKeyRange
    })
    await database.add(i1)
    await database.add(i2)
    await database.disposeAsync()

    const x1 = await database.getItem({ id: i1.baseId })
    expect(x1).toMatchSnapshot()

    const x2 = await database.getItem({ id: i2.baseId })
    expect(x2).toMatchSnapshot()
  })

  test('write two items to queue use processItems', async () => {
    const i1: Item = { baseId: 'id1', base: { id: 'id', speckle_type: 'type' } }
    const i2: Item = { baseId: 'id2', base: { id: 'id', speckle_type: 'type' } }
    const database = new IndexedDatabase({
      indexedDB: new IDBFactory(),
      keyRange: IDBKeyRange
    })
    await database.add(i1)
    await database.add(i2)
    await database.disposeAsync()

    const foundItems = new BufferQueue<Item>()
    const notFoundItems = new BufferQueue<string>()

    await database.processItems({
      ids: [i1.baseId, i2.baseId],
      foundItems,
      notFoundItems
    })

    expect(foundItems.values()).toMatchSnapshot()
    expect(notFoundItems.values()).toMatchSnapshot()
  })
})
