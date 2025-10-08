import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MemoryCache, MemoryCacheItem, MemoryCacheOptions } from './MemoryCache.js'
import { Item, Base } from '../types/types.js'
import { CustomLogger } from '../types/functions.js'

const logger: CustomLogger = () => {
  // console.log(message, ...optionalParams)
}

const defaultOptions: MemoryCacheOptions = {
  maxSizeInMb: 10,
  ttlms: 1000
}

const createItem = (id: string, size: number, referencedIds: string[] = []): Item => {
  const base: Base & { data?: unknown } = {
    id,
    // eslint-disable-next-line camelcase
    speckle_type: 'Base'
  }

  if (referencedIds.length > 0) {
    base.data = referencedIds.map((referencedId) => ({
      // eslint-disable-next-line camelcase
      speckle_type: 'reference',
      referencedId
    }))
  }

  return {
    baseId: id,
    base,
    size
  }
}

describe('MemoryCacheItem', () => {
  it('should correctly determine if it is expired', () => {
    const item = createItem('1', 100)
    const now = Date.now()
    const cacheItem = new MemoryCacheItem(item, now + 1000)
    expect(cacheItem.isExpired(now + 500)).toBe(false)
    expect(cacheItem.isExpired(now + 1500)).toBe(true)
  })

  it('should update its access time', () => {
    const item = createItem('1', 100)
    const now = Date.now()
    const cacheItem = new MemoryCacheItem(item, now + 1000)
    cacheItem.setAccess(now + 500, 1000)
    expect(cacheItem.isExpired(now + 1000)).toBe(false)
    expect(cacheItem.isExpired(now + 1600)).toBe(true)
  })

  it('should return the correct item', () => {
    const item = createItem('1', 100)
    const cacheItem = new MemoryCacheItem(item, Date.now() + 1000)
    expect(cacheItem.getItem()).toEqual(item)
  })

  it('should be done if expired', () => {
    const item = createItem('1', 100)
    const now = Date.now()
    const cacheItem = new MemoryCacheItem(item, now + 1000)
    expect(cacheItem.done(now + 1500)).toBe(true)
    expect(cacheItem.done(now + 500)).toBe(false)
  })
})

describe('MemoryCache', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should add and get an item', () => {
    const cache = new MemoryCache(defaultOptions, logger)
    const item = createItem('1', 100)
    const requestItem = vi.fn()

    cache.add(item, requestItem)
    const retrieved = cache.get('1')

    expect(retrieved).toEqual(item)
    expect(requestItem).not.toHaveBeenCalled()
  })

  it('should update expiry on get', () => {
    const cache = new MemoryCache({ ...defaultOptions, ttlms: 100 }, logger)
    const item = createItem('1', 100)
    cache.add(item, vi.fn())

    vi.advanceTimersByTime(50)
    const retrieved = cache.get('1')
    expect(retrieved).toBeDefined()

    vi.advanceTimersByTime(80)
    const retrievedAgain = cache.get('1')
    expect(retrievedAgain).toBeDefined()
  })

  it('should return undefined for non-existent item', () => {
    const cache = new MemoryCache(defaultOptions, logger)
    expect(cache.get('non-existent')).toBeUndefined()
  })

  it('should scan for references and request missing ones', () => {
    const cache = new MemoryCache(defaultOptions, logger)
    const requestItem = vi.fn()
    const item = createItem('1', 100, ['2', '3'])

    cache.add(createItem('3', 50), vi.fn()) // pre-cache one of the references
    cache.scanForReferences(item.base, requestItem)

    expect(requestItem).toHaveBeenCalledTimes(1)
    expect(requestItem).toHaveBeenCalledWith('2')
    expect(requestItem).not.toHaveBeenCalledWith('3')
  })

  it('should clean up expired items when size exceeds max', () => {
    const options = { maxSizeInMb: 0, ttlms: 100 } // 100 bytes
    const cache = new MemoryCache(options, logger)
    const requestItem = vi.fn()

    const item1 = createItem('1', 60)
    const item2 = createItem('2', 60)

    const now = 1
    cache.add(item1, requestItem, now - 200)
    cache.cleanCache(now)
    cache.add(item2, requestItem, now + 100)

    expect(cache.get('1')).toBeUndefined()
    expect(cache.get('2')).toBeDefined()
  })

  it('should not clean up expired items if they have references', () => {
    const options = { maxSizeInMb: 0.0001, ttlms: 100 } // 100 bytes
    const cache = new MemoryCache(options, logger)
    const requestItem = vi.fn()

    const item1 = createItem('1', 60)
    const item2 = createItem('2', 60, ['1'])

    cache.add(item1, requestItem)
    vi.advanceTimersByTime(110) // item1 expires
    cache.add(item2, requestItem) // item2 adds a reference to item1

    vi.advanceTimersByTime(100)

    expect(cache.get('1')).toBeDefined()
    expect(cache.get('2')).toBeDefined()
  })

  it('compareMaybeBasesByReferences should sort correctly', () => {
    const cache = new MemoryCache(defaultOptions, logger)
    const requestItem = vi.fn()

    const item1 = createItem('1', 10)
    const item2 = createItem('2', 10)
    const item3 = createItem('3', 10, ['1', '2'])
    const item4 = createItem('4', 10, ['2'])

    cache.add(item1, requestItem)
    cache.add(item2, requestItem)
    cache.add(item3, requestItem)
    cache.add(item4, requestItem)

    expect(cache.compareMaybeBasesByReferences('1', '2')).toBe(-1)
    expect(cache.compareMaybeBasesByReferences('2', '1')).toBe(1)
    expect(cache.compareMaybeBasesByReferences('1', '1')).toBe(0)
    expect(cache.compareMaybeBasesByReferences('1', '5')).toBe(1)
    expect(cache.compareMaybeBasesByReferences('5', '1')).toBe(-1)
    expect(cache.compareMaybeBasesByReferences('5', '6')).toBe(0)
  })

  it('should throw when used after dispose', () => {
    const cache = new MemoryCache(defaultOptions, logger)
    cache.dispose()
    const item = createItem('1', 100)
    expect(() => cache.add(item, vi.fn())).toThrow('MemoryCache is disposed')
    expect(() => cache.get('1')).toThrow('MemoryCache is disposed')
  })
})
