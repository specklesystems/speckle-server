import { describe, expect, test } from 'vitest'
import CacheDatabase from './database.js'
import indexeddb from 'fake-indexeddb'
import { Item } from '../types/types.js'

globalThis.indexedDB = indexeddb

describe('database cache', () => {
  test('write to queue', async () => {
    const i: Item = { id: 'id', obj: { id: 'id' } }
    const database = new CacheDatabase(() => {}, { batchMaxWait: 200 })
    await database.write(i)
    await database.finish()

    const x = await database.cacheGetObject('id')
    console.log(JSON.stringify(x))
    expect(x).toBeDefined()
    expect(x).toHaveProperty('id')
    expect(x).toHaveProperty('obj')
    expect(JSON.stringify(x)).toBe(JSON.stringify(i))
  })

  test('set/get', async () => {
    const i: Item = { id: 'id', obj: { id: 'id' } }
    const database = new CacheDatabase(() => {})
    await database.cacheStoreObjects([i])

    const x = await database.cacheGetObject('id')
    expect(x).toBeDefined()
    expect(x).toHaveProperty('id')
    expect(x).toHaveProperty('obj')
    expect(JSON.stringify(x)).toBe(JSON.stringify(i))
  })
})
