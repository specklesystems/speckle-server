import { vi, describe, it, expect } from 'vitest'
import { DefermentManager } from './defermentManager.js'
import { MemoryCache } from './MemoryCache.js'
import { CustomLogger } from '../types/functions.js'
import { Item } from '../types/types.js'

describe('DefermentManager', () => {
  it('should be created', () => {
    const mockLogger: CustomLogger = vi.fn()
    const mockCache = {
      get: vi.fn(),
      add: vi.fn(),
      dispose: vi.fn()
    } as unknown as MemoryCache
    const defermentManager = new DefermentManager(mockLogger, mockCache)
    expect(defermentManager).toBeDefined()
  })

  describe('defer', () => {
    it('should return a resolved promise if item is in cache', async () => {
      const mockLogger: CustomLogger = vi.fn()
      const get = vi.fn()
      const add = vi.fn()
      const mockCache = {
        get,
        add
      } as unknown as MemoryCache
      const defermentManager = new DefermentManager(mockLogger, mockCache)

      const item: Item = {
        // eslint-disable-next-line camelcase
        base: { id: 'testId', speckle_type: 'Base' },
        baseId: 'testId'
      }
      get.mockReturnValue(item)

      const [promise, wasInCache] = defermentManager.defer({ id: 'testId' })
      const result = await promise

      expect(wasInCache).toBe(true)
      expect(result).toEqual(item.base)
      expect(get).toHaveBeenCalledWith('testId')
    })

    it('should return the same promise if item is already outstanding', () => {
      const mockLogger: CustomLogger = vi.fn()
      const get = vi.fn()
      const add = vi.fn()
      const mockCache = {
        get,
        add
      } as unknown as MemoryCache
      const defermentManager = new DefermentManager(mockLogger, mockCache)

      const [promise1, wasInCache1] = defermentManager.defer({ id: 'testId' })
      const [promise2, wasInCache2] = defermentManager.defer({ id: 'testId' })

      expect(wasInCache1).toBe(false)
      expect(wasInCache2).toBe(true)
      expect(promise1).toBe(promise2)
    })

    it('should create a new deferred base if not in cache and not outstanding', () => {
      const mockLogger: CustomLogger = vi.fn()
      const get = vi.fn()
      const add = vi.fn()
      const mockCache = {
        get,
        add
      } as unknown as MemoryCache
      const defermentManager = new DefermentManager(mockLogger, mockCache)

      const [promise, wasInCache] = defermentManager.defer({ id: 'testId' })

      expect(wasInCache).toBe(false)
      expect(promise).toBeInstanceOf(Promise)
    })

    it('should throw if disposed', () => {
      const mockLogger: CustomLogger = vi.fn()
      const get = vi.fn()
      const add = vi.fn()
      const mockCache = {
        get,
        add,
        dispose: vi.fn()
      } as unknown as MemoryCache
      const defermentManager = new DefermentManager(mockLogger, mockCache)

      defermentManager.dispose()
      expect(() => defermentManager.defer({ id: 'testId' })).toThrow(
        'DefermentManager is disposed'
      )
    })
  })

  describe('undefer', () => {
    it('should resolve the promise when an outstanding item is found', async () => {
      const mockLogger: CustomLogger = vi.fn()
      const get = vi.fn()
      const add = vi.fn()
      const mockCache = {
        get,
        add
      } as unknown as MemoryCache
      const defermentManager = new DefermentManager(mockLogger, mockCache)
      const requestItem = vi.fn()

      const [promise] = defermentManager.defer({ id: 'testId' })

      const item: Item = {
        // eslint-disable-next-line camelcase
        base: { id: 'testId', speckle_type: 'Base' },
        baseId: 'testId'
      }
      defermentManager.undefer(item, requestItem)

      const result = await promise
      expect(result).toEqual(item.base)
    })

    it('should log an error if item has no base', () => {
      const mockLogger: CustomLogger = vi.fn()
      const get = vi.fn()
      const add = vi.fn()
      const mockCache = {
        get,
        add
      } as unknown as MemoryCache
      const defermentManager = new DefermentManager(mockLogger, mockCache)
      const requestItem = vi.fn()

      const item: Item = { baseId: 'testId' }
      defermentManager.undefer(item, requestItem)
      expect(mockLogger).toHaveBeenCalledWith('undefer called with no base', item)
    })

    it('should add to cache and request item if not outstanding', () => {
      const mockLogger: CustomLogger = vi.fn()
      const get = vi.fn()
      const add = vi.fn()
      const mockCache = {
        get,
        add
      } as unknown as MemoryCache
      const defermentManager = new DefermentManager(mockLogger, mockCache)
      const requestItem = vi.fn()

      const item: Item = {
        // eslint-disable-next-line camelcase
        base: { id: 'testId', speckle_type: 'Base' },
        baseId: 'testId'
      }
      add.mockImplementation((_item: Item, getDependencies?: (id: string) => void) => {
        if (getDependencies) getDependencies('testId')
      })

      defermentManager.undefer(item, requestItem)

      expect(add).toHaveBeenCalledWith(item, expect.any(Function))
      expect(requestItem).toHaveBeenCalledWith('testId')
    })

    it('should throw if disposed', () => {
      const mockLogger: CustomLogger = vi.fn()
      const get = vi.fn()
      const add = vi.fn()
      const mockCache = {
        get,
        add,
        dispose: vi.fn()
      } as unknown as MemoryCache
      const defermentManager = new DefermentManager(mockLogger, mockCache)
      const requestItem = vi.fn()

      defermentManager.dispose()
      const item: Item = {
        // eslint-disable-next-line camelcase
        base: { id: 'testId', speckle_type: 'Base' },
        baseId: 'testId'
      }
      expect(() => defermentManager.undefer(item, requestItem)).toThrow(
        'DefermentManager is disposed'
      )
    })
  })

  describe('dispose', () => {
    it('should clear all outstanding deferments', () => {
      const mockLogger: CustomLogger = vi.fn()
      const get = vi.fn()
      const add = vi.fn()
      const mockCache = {
        get,
        add,
        dispose: vi.fn()
      } as unknown as MemoryCache
      const defermentManager = new DefermentManager(mockLogger, mockCache)

      void defermentManager.defer({ id: 'testId' })
      defermentManager.dispose()
      // @ts-expect-error - accessing private property for testing
      expect(defermentManager.outstanding.size).toBe(0)
    })

    it('should not do anything if already disposed', () => {
      const mockLogger: CustomLogger = vi.fn()
      const get = vi.fn()
      const add = vi.fn()
      const mockCache = {
        get,
        add,
        dispose: vi.fn()
      } as unknown as MemoryCache
      const defermentManager = new DefermentManager(mockLogger, mockCache)

      defermentManager.dispose()
      // @ts-expect-error - accessing private property for testing
      const outstanding = defermentManager.outstanding
      const clearSpy = vi.spyOn(outstanding, 'clear')
      defermentManager.dispose()
      expect(clearSpy).not.toHaveBeenCalled()
    })
  })
})
