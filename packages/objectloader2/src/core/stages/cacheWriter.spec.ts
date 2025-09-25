import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Item } from '../../types/types.js'
import { CacheWriter } from './cacheWriter.js'
import { DefermentManager } from '../../deferment/defermentManager.js'
import { Database } from '../interfaces.js'
import { MemoryCache, MemoryCacheOptions } from '../../deferment/MemoryCache.js'
import { CacheOptions } from '../options.js'
import { CustomLogger } from '../../types/functions.js'

// Mock implementations
class MockDatabase implements Database {
  savedItems: Item[] = []

  getAll(/* keys */): Promise<(Item | undefined)[]> {
    return Promise.resolve([])
  }

  putAll(batch: Item[]): Promise<void> {
    this.savedItems.push(...batch)
    return Promise.resolve()
  }

  dispose(): void {
    this.savedItems = []
  }
}

describe('CacheWriter', () => {
  let database: MockDatabase
  let defermentManager: DefermentManager
  let cacheWriter: CacheWriter
  let logger: CustomLogger
  let requestItemMock: (id: string) => void
  let options: CacheOptions
  let memoryCache: MemoryCache

  beforeEach(() => {
    database = new MockDatabase()
    logger = vi.fn() as CustomLogger
    const memoryCacheOptions: MemoryCacheOptions = {
      maxSizeInMb: 100,
      ttlms: 60000
    }
    memoryCache = new MemoryCache(memoryCacheOptions, logger)
    defermentManager = new DefermentManager(logger, memoryCache)
    requestItemMock = vi.fn()

    options = {
      maxCacheWriteSize: 10,
      maxCacheBatchWriteWait: 50,
      maxCacheReadSize: 10,
      maxCacheBatchReadWait: 50,
      maxWriteQueueSize: 100
    }

    cacheWriter = new CacheWriter(
      database,
      logger,
      defermentManager,
      options,
      requestItemMock
    )
  })

  afterEach(async () => {
    await cacheWriter.disposeAsync()
  })

  it('should write items to the database', async () => {
    const item: Item = {
      baseId: 'test-id',
      base: { id: 'test-id', speckle_type: 'test-type' }
    }

    cacheWriter.add(item)

    // Wait for batch queue to process
    await new Promise((resolve) =>
      setTimeout(resolve, options.maxCacheBatchWriteWait + 10)
    )

    expect(database.savedItems).toHaveLength(1)
    expect(database.savedItems[0].baseId).toBe('test-id')
    expect(database.savedItems[0].base).toEqual({
      id: 'test-id',
      speckle_type: 'test-type'
    })
  })

  it('should write multiple items in a batch', async () => {
    const items = [
      {
        baseId: 'item1',
        base: { id: 'item1', speckle_type: 'test-type' }
      },
      {
        baseId: 'item2',
        base: { id: 'item2', speckle_type: 'test-type' }
      },
      {
        baseId: 'item3',
        base: { id: 'item3', speckle_type: 'test-type' }
      }
    ]

    items.forEach((item) => cacheWriter.add(item))

    // Wait for batch queue to process
    await new Promise((resolve) =>
      setTimeout(resolve, options.maxCacheBatchWriteWait + 10)
    )

    expect(database.savedItems).toHaveLength(3)
    expect(database.savedItems.map((item) => item.baseId)).toEqual([
      'item1',
      'item2',
      'item3'
    ])
  })

  it('should call undefer on the defermentManager', () => {
    const spy = vi.spyOn(defermentManager, 'undefer')
    const item: Item = {
      baseId: 'test-id',
      base: { id: 'test-id', speckle_type: 'test-type' }
    }

    cacheWriter.add(item)

    expect(spy).toHaveBeenCalledWith(item, requestItemMock)
  })

  it('should handle items with id but no base', async () => {
    const item: Item = {
      baseId: 'test-id-no-base'
      // No base property
    }

    // Adding an item with no base should not throw an error
    expect(() => cacheWriter.add(item)).not.toThrow()

    // Wait for batch queue to process
    await new Promise((resolve) =>
      setTimeout(resolve, options.maxCacheBatchWriteWait + 10)
    )

    expect(database.savedItems).toHaveLength(1)
    expect(database.savedItems[0].baseId).toBe('test-id-no-base')
    expect(database.savedItems[0].base).toBeUndefined()
  })

  it('should process items in batches according to maxCacheWriteSize', async () => {
    const spy = vi.spyOn(database, 'putAll')
    const smallBatchOptions: CacheOptions = {
      ...options,
      maxCacheWriteSize: 2, // Set small batch size
      maxCacheBatchWriteWait: 100
    }

    const smallBatchCacheWriter = new CacheWriter(
      database,
      logger,
      defermentManager,
      smallBatchOptions,
      requestItemMock
    )

    // Add 5 items
    const items = Array.from({ length: 5 }, (_, i) => ({
      baseId: `batch-item-${i}`,
      base: { id: `batch-item-${i}`, speckle_type: 'test-type' }
    }))

    items.forEach((item) => smallBatchCacheWriter.add(item))

    // Wait for batch queue to process
    await new Promise((resolve) =>
      setTimeout(resolve, smallBatchOptions.maxCacheBatchWriteWait * 2 + 50)
    )

    // With batch size 2, we expect 3 calls to saveBatch: 2 items + 2 items + 1 item
    expect(spy).toHaveBeenCalledTimes(3)

    await smallBatchCacheWriter.disposeAsync()
  })

  it('should be disposed correctly', async () => {
    expect(cacheWriter.isDisposed).toBe(false)
    await cacheWriter.disposeAsync()
    expect(cacheWriter.isDisposed).toBe(true)
  })

  it('should write directly with writeAll method', async () => {
    const items = [
      {
        baseId: 'direct1',
        base: { id: 'direct1', speckle_type: 'test-type' }
      },
      {
        baseId: 'direct2',
        base: { id: 'direct2', speckle_type: 'test-type' }
      }
    ]

    await cacheWriter.writeAll(items)

    expect(database.savedItems).toHaveLength(2)
    expect(database.savedItems.map((item) => item.baseId)).toEqual([
      'direct1',
      'direct2'
    ])
  })
})
