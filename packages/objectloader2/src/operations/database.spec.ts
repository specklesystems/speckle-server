import { describe, expect, test } from 'vitest'
import CacheDatabase from './database.js'
import indexeddb from 'fake-indexeddb'
import { Item } from '../types/types.js'
import ArrayQueue from '../helpers/ArrayQueue.js'

globalThis.indexedDB = indexeddb

describe('database cache', () => {
  test('write single item to queue use getItem', async () => {
    const i: Item = { baseId: 'id', base: { id: 'id' } }
    const database = new CacheDatabase(() => {}, { batchMaxWait: 200 })
    await database.write(i)
    await database.finish()

    const x = await database.getItem('id')
    expect(x).toBeDefined()
    expect(JSON.stringify(x)).toBe(JSON.stringify(i))
  })

  test('write single item with setItems and getItem', async () => {
    const i: Item = { baseId: 'id', base: { id: 'id' } }
    const database = new CacheDatabase(() => {})
    await database.setItems([i])

    const x = await database.getItem('id')
    expect(x).toBeDefined()
    expect(JSON.stringify(x)).toBe(JSON.stringify(i))
  })

  test('write two items to queue use getItem', async () => {
    const i1: Item = { baseId: 'id1', base: { id: 'id' } }
    const i2: Item = { baseId: 'id2', base: { id: 'id' } }
    const database = new CacheDatabase(() => {}, { batchMaxWait: 200 })
    await database.write(i1)
    await database.write(i2)
    await database.finish()

    const x1 = await database.getItem(i1.baseId)
    expect(x1).toBeDefined()
    expect(JSON.stringify(x1)).toBe(JSON.stringify(i1))

    const x2 = await database.getItem(i2.baseId)
    expect(x2).toBeDefined()
    expect(JSON.stringify(x2)).toBe(JSON.stringify(i2))
  })

  test('write two items to queue use getItem', async () => {
    const i1: Item = { baseId: 'id1', base: { id: 'id' } }
    const i2: Item = { baseId: 'id2', base: { id: 'id' } }
    const database = new CacheDatabase(() => {}, { batchMaxWait: 200 })
    await database.write(i1)
    await database.write(i2)
    await database.finish()

    const itemQueue = new ArrayQueue<Item>()
    const notFoundQueue = new ArrayQueue<string>()

    await database.getItems([i1.baseId, i2.baseId], itemQueue, notFoundQueue)

    expect(itemQueue.values().length).toBe(2)
    expect(JSON.stringify(itemQueue.values()[0])).toBe(JSON.stringify(i1))
    expect(JSON.stringify(itemQueue.values()[1])).toBe(JSON.stringify(i2))

    expect(notFoundQueue.values().length).toBe(0)
  })
})
