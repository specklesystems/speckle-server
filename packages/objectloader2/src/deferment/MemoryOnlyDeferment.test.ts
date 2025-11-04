import { describe, it, expect, beforeEach } from 'vitest'
import { MemoryOnlyDeferment } from './MemoryOnlyDeferment.js'
import { Base } from '../types/types.js'

describe('MemoryOnlyDeferment', () => {
  let itemsMap: Map<string, Base>
  let deferment: MemoryOnlyDeferment

  const createBase = (id: string, speckleType = 'Base'): Base => ({
    id,
    // eslint-disable-next-line camelcase
    speckle_type: speckleType
  })

  beforeEach(() => {
    itemsMap = new Map<string, Base>()
    deferment = new MemoryOnlyDeferment(itemsMap)
  })

  describe('constructor', () => {
    it('should create an instance with provided items map', () => {
      const items = new Map<string, Base>()
      const memoryDeferment = new MemoryOnlyDeferment(items)
      expect(memoryDeferment).toBeDefined()
      expect(memoryDeferment).toBeInstanceOf(MemoryOnlyDeferment)
    })

    it('should work with empty items map', () => {
      const items = new Map<string, Base>()
      const memoryDeferment = new MemoryOnlyDeferment(items)
      expect(memoryDeferment).toBeDefined()
    })

    it('should work with pre-populated items map', () => {
      const items = new Map<string, Base>()
      const base = createBase('test-id')
      items.set('test-id', base)
      const memoryDeferment = new MemoryOnlyDeferment(items)
      expect(memoryDeferment).toBeDefined()
    })
  })

  describe('defer', () => {
    it('should return resolved promise and true when item exists in cache', async () => {
      const base = createBase('existing-id', 'TestObject')
      itemsMap.set('existing-id', base)

      const [promise, wasInCache] = deferment.defer({ id: 'existing-id' })

      expect(wasInCache).toBe(true)
      await expect(promise).resolves.toEqual(base)
    })

    it('should return rejected promise and false when item does not exist in cache', async () => {
      const [promise, wasInCache] = deferment.defer({ id: 'non-existing-id' })

      expect(wasInCache).toBe(false)
      await expect(promise).rejects.toThrow('Not found in cache: non-existing-id')
    })

    it('should handle multiple items in cache correctly', async () => {
      const base1 = createBase('id-1', 'Object1')
      const base2 = createBase('id-2', 'Object2')
      const base3 = createBase('id-3', 'Object3')

      itemsMap.set('id-1', base1)
      itemsMap.set('id-2', base2)
      itemsMap.set('id-3', base3)

      // Test existing items
      const [promise1, wasInCache1] = deferment.defer({ id: 'id-1' })
      const [promise2, wasInCache2] = deferment.defer({ id: 'id-2' })
      const [promise3, wasInCache3] = deferment.defer({ id: 'id-3' })

      expect(wasInCache1).toBe(true)
      expect(wasInCache2).toBe(true)
      expect(wasInCache3).toBe(true)

      await expect(promise1).resolves.toEqual(base1)
      await expect(promise2).resolves.toEqual(base2)
      await expect(promise3).resolves.toEqual(base3)

      // Test non-existing item
      const [promise4, wasInCache4] = deferment.defer({ id: 'id-4' })
      expect(wasInCache4).toBe(false)
      await expect(promise4).rejects.toThrow('Not found in cache: id-4')
    })

    it('should handle empty string id', async () => {
      const [promise, wasInCache] = deferment.defer({ id: '' })

      expect(wasInCache).toBe(false)
      await expect(promise).rejects.toThrow('Not found in cache: ')
    })

    it('should handle Base objects with complex properties', async () => {
      const complexBase: Base = {
        id: 'complex-id',
        // eslint-disable-next-line camelcase
        speckle_type: 'ComplexObject',
        __closure: { 'some-ref': 1, 'another-ref': 2 }
      }

      itemsMap.set('complex-id', complexBase)

      const [promise, wasInCache] = deferment.defer({ id: 'complex-id' })

      expect(wasInCache).toBe(true)
      await expect(promise).resolves.toEqual(complexBase)
    })

    it('should return the same Base object reference that was stored', async () => {
      const base = createBase('ref-test-id')
      itemsMap.set('ref-test-id', base)

      const [promise] = deferment.defer({ id: 'ref-test-id' })
      const result = await promise

      expect(result).toBe(base) // Same reference
    })

    it('should handle case-sensitive ids', async () => {
      const base1 = createBase('CaseTest', 'Object1')
      const base2 = createBase('casetest', 'Object2')

      itemsMap.set('CaseTest', base1)
      itemsMap.set('casetest', base2)

      const [promise1] = deferment.defer({ id: 'CaseTest' })
      const [promise2] = deferment.defer({ id: 'casetest' })
      const [promise3, wasInCache3] = deferment.defer({ id: 'CASETEST' })

      await expect(promise1).resolves.toEqual(base1)
      await expect(promise2).resolves.toEqual(base2)
      expect(wasInCache3).toBe(false)
      await expect(promise3).rejects.toThrow('Not found in cache: CASETEST')
    })
  })

  describe('undefer', () => {
    it('should be a no-op function', async () => {
      // Since undefer is documented as a no-op, we just verify it can be called
      // without throwing and doesn't affect the state
      const base = createBase('test-id')
      itemsMap.set('test-id', base)

      expect(() => deferment.undefer()).not.toThrow()

      // Verify state is unchanged
      const [promise, wasInCache] = deferment.defer({ id: 'test-id' })
      expect(wasInCache).toBe(true)
      await expect(promise).resolves.toEqual(base)
    })

    it('should be callable multiple times without effect', () => {
      expect(() => {
        deferment.undefer()
        deferment.undefer()
        deferment.undefer()
      }).not.toThrow()
    })
  })

  describe('dispose', () => {
    it('should be a no-op function', async () => {
      // Since dispose is documented as a no-op, we just verify it can be called
      // without throwing and doesn't affect the state
      const base = createBase('test-id')
      itemsMap.set('test-id', base)

      expect(() => deferment.dispose()).not.toThrow()

      // Verify state is unchanged
      const [promise, wasInCache] = deferment.defer({ id: 'test-id' })
      expect(wasInCache).toBe(true)
      await expect(promise).resolves.toEqual(base)
    })

    it('should be callable multiple times without effect', () => {
      expect(() => {
        deferment.dispose()
        deferment.dispose()
        deferment.dispose()
      }).not.toThrow()
    })
  })

  describe('edge cases', () => {
    it('should work with items map that is modified after construction', async () => {
      const base = createBase('dynamic-id')

      // Initially empty
      const [promise1, wasInCache1] = deferment.defer({ id: 'dynamic-id' })
      expect(wasInCache1).toBe(false)
      await expect(promise1).rejects.toThrow('Not found in cache: dynamic-id')

      // Add item to the map
      itemsMap.set('dynamic-id', base)

      // Now it should be found
      const [promise2, wasInCache2] = deferment.defer({ id: 'dynamic-id' })
      expect(wasInCache2).toBe(true)
      await expect(promise2).resolves.toEqual(base)
    })

    it('should work when items are removed from the map after construction', async () => {
      const base = createBase('removable-id')
      itemsMap.set('removable-id', base)

      // Initially present
      const [promise1, wasInCache1] = deferment.defer({ id: 'removable-id' })
      expect(wasInCache1).toBe(true)
      await expect(promise1).resolves.toEqual(base)

      // Remove from map
      itemsMap.delete('removable-id')

      // Now should not be found
      const [promise2, wasInCache2] = deferment.defer({ id: 'removable-id' })
      expect(wasInCache2).toBe(false)
      await expect(promise2).rejects.toThrow('Not found in cache: removable-id')
    })

    it('should handle null/undefined values in the map gracefully', () => {
      // TypeScript should prevent this, but testing runtime behavior
      const base = createBase('valid-id')
      itemsMap.set('valid-id', base)

      // This shouldn't be possible with proper typing, but let's verify behavior
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      ;(itemsMap as any).set('null-id', null)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      ;(itemsMap as any).set('undefined-id', undefined)

      const [, wasInCache1] = deferment.defer({ id: 'null-id' })
      const [, wasInCache2] = deferment.defer({ id: 'undefined-id' })

      expect(wasInCache1).toBe(false) // null is falsy, so treated as not found
      expect(wasInCache2).toBe(false) // undefined is falsy, so treated as not found
    })
  })
})
