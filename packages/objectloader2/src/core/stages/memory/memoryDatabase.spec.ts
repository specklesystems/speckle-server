import { describe, it, expect, beforeEach } from 'vitest'
import { Item, Base } from '../../../types/types.js'
import { MemoryDatabase } from './memoryDatabase.js'

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
    await db.putAll([item])
    const result = await db.getAll(['id1'])
    expect(result).toEqual([item])
  })

  it('should add and retrieve multiple items', async () => {
    const items = [makeItem('id1'), makeItem('id2', 'baz')]
    await db.putAll(items)
    const result = await db.getAll(['id1', 'id2'])
    expect(result).toEqual(items)
  })

  it('should overwrite items with the same key', async () => {
    const item1 = makeItem('id1', 'foo')
    const item2 = makeItem('id1', 'bar')
    await db.putAll([item1])
    await db.putAll([item2])
    const result = await db.getAll(['id1'])
    expect(result).toEqual([item2])
  })

  it('dispose should not throw', () => {
    db.dispose()
  })
})
