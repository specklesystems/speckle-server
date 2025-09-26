import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'

import { Base, Item } from '../../types/types.js'
import { IndexedDatabase, IndexedDatabaseOptions } from './indexedDatabase.js'

// Mock Item
const defaultItem = (id: string): Item => ({
  baseId: id,
  base: { foo: 'bar' } as unknown as Base
})

describe('IndexedDatabase', () => {
  let db: IndexedDatabase
  let options: IndexedDatabaseOptions

  beforeEach(() => {
    options = { indexedDB: new IDBFactory(), keyRange: IDBKeyRange }
    db = new IndexedDatabase(options)
  })

  afterEach(() => {
    db.dispose()
  })

  it('should add and get multiple items', async () => {
    const items = [defaultItem('id1'), defaultItem('id2')]
    await db.putAll(items)
    const result = await db.getAll(['id1', 'id2'])
    expect(result).toMatchSnapshot()
    expect(result).toEqual(items)
  })

  it('should dispose without error', () => {
    expect(() => db.dispose()).not.toThrow()
  })
})
