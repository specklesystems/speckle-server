import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { IDBFactory, IDBKeyRange } from 'fake-indexeddb'
import IndexedDatabase, { IndexedDatabaseOptions } from './indexedDatabase.js'

import { Item, Base } from '../../types/types.js'

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

  afterEach(async () => {
    await db.disposeAsync()
  })

  it('should add and get multiple items', async () => {
    const items = [defaultItem('id1'), defaultItem('id2')]
    await db.saveBatch({ batch: items })
    const result = await db.getAll(['id1', 'id2'])
    expect(result).toMatchSnapshot()
    expect(result).toEqual(items)
  })

  it('should dispose without error', async () => {
    await expect(db.disposeAsync()).resolves.not.toThrow()
  })
})
