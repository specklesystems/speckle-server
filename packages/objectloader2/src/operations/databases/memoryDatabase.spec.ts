import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryDatabase } from './memoryDatabase.js'
import { Base, Item } from '../../types/types.js'

const makeItem = (id: string, foo = 'bar'): Item => ({
  baseId: id,
  base: { foo } as unknown as Base
})

describe('MemoryDatabase', () => {
  let db: MemoryDatabase

  beforeEach(() => {
    db = new MemoryDatabase()
  })

  it('should return undefined for missing keys', async () => {
    const result = await db.getAll(['missing'])
    expect(result).toEqual([undefined])
  })

  it('should add and retrieve a single item', async () => {
    const item = makeItem('id1')
    await db.cacheSaveBatch({ batch: [item] })
    const result = await db.getAll(['id1'])
    expect(result).toEqual([item])
  })

  it('should add and retrieve multiple items', async () => {
    const items = [makeItem('id1'), makeItem('id2', 'baz')]
    await db.cacheSaveBatch({ batch: items })
    const result = await db.getAll(['id1', 'id2'])
    expect(result).toEqual(items)
  })

  it('should overwrite items with the same key', async () => {
    const item1 = makeItem('id1', 'foo')
    const item2 = makeItem('id1', 'bar')
    await db.cacheSaveBatch({ batch: [item1] })
    await db.cacheSaveBatch({ batch: [item2] })
    const result = await db.getAll(['id1'])
    expect(result).toEqual([item2])
  })

  it('disposeAsync should resolve', async () => {
    await expect(db.disposeAsync()).resolves.not.toThrow()
  })
})
