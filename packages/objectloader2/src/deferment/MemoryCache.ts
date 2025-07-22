import { CustomLogger } from '../types/functions.js'
import { Item } from '../types/types.js'

export interface MemoryCacheOptions {
  maxSizeInMb: number
  ttlms: number
}

export class MemoryCacheItem {
  private item: Item
  private expiresAt: number // Timestamp in ms

  constructor(item: Item, expiresAt: number) {
    this.item = item
    this.expiresAt = expiresAt
  }

  isExpired(now: number): boolean {
    return now > this.expiresAt
  }
  setAccess(now: number, ttl: number): void {
    this.expiresAt = now + ttl
  }

  getItem(): Item {
    return this.item
  }

  done(now: number): boolean {
    if (this.isExpired(now)) {
      return true
    }
    return false
  }
}

export class MemoryCache {
  private isGathered: Map<string, boolean> = new Map()
  private references: Map<string, number> = new Map()
  private cache: Map<string, MemoryCacheItem> = new Map()

  private options: MemoryCacheOptions
  private logger: CustomLogger
  private disposed = false
  private currentSize = 0
  private timer?: ReturnType<typeof setTimeout>

  constructor(options: MemoryCacheOptions, logger: CustomLogger) {
    this.options = options
    this.logger = logger
    this.resetGlobalTimer()
  }

  add(item: Item, requestItem: (id: string) => void, testNow?: number): void {
    if (this.disposed) throw new Error('MemoryCache is disposed')
    this.currentSize += item.size || 0
    this.cache.set(
      item.baseId,
      new MemoryCacheItem(item, (testNow || this.now()) + this.options.ttlms)
    )

    if (!this.isGathered.has(item.baseId)) {
      this.isGathered.set(item.baseId, true)
      this.scanForReferences(item.base!, requestItem)
    }
  }

  get(id: string): Item | undefined {
    if (this.disposed) throw new Error('MemoryCache is disposed')
    const item = this.cache.get(id)
    if (item) {
      item.setAccess(this.now(), this.options.ttlms)
      return item.getItem()
    }
    return undefined
  }

  scanForReferences(data: unknown, requestItem: (id: string) => void): void {
    const scan = (item: unknown): void => {
      // Stop if the item is null or not an object (i.e., primitive)
      if (item === null || typeof item !== 'object') {
        return
      }

      // If it's an array, scan each element
      if (Array.isArray(item)) {
        for (const element of item) {
          scan(element)
        }
        return
      }

      // If it's an object, scan its properties
      for (const key in item) {
        if (Object.prototype.hasOwnProperty.call(item, key)) {
          // We found the target property!
          if (key === 'referencedId') {
            const value = (item as { referencedId: unknown }).referencedId
            // Ensure the value is a string before adding it
            if (typeof value === 'string') {
              this.references.set(value, (this.references.get(value) || 0) + 1)
              if (!this.cache.has(value)) {
                requestItem(value)
              }
            }
          }

          // Continue scanning deeper into the object's properties
          scan((item as Record<string, unknown>)[key])
        }
      }
    }

    scan(data)
  }

  private resetGlobalTimer(): void {
    const run = (): void => {
      this.cleanCache()
      this.timer = setTimeout(run, this.options.ttlms)
    }
    this.timer = setTimeout(run, this.options.ttlms)
  }

  private now(): number {
    return Date.now()
  }

  cleanCache(testNow?: number): void {
    const maxSizeBytes = this.options.maxSizeInMb * 1024 * 1024
    if (this.currentSize < maxSizeBytes) {
      this.logger(
        `cache size (${this.currentSize} < ${maxSizeBytes}) is ok, no need to clean`
      )
      return
    }
    const now = testNow || this.now()
    let cleaned = 0
    const start = performance.now()
    for (const deferredBase of Array.from(this.cache.values())
      .filter((x) => x.isExpired(now))
      .sort((a, b) =>
        this.compareMaybeBasesByReferences(a.getItem().baseId, b.getItem().baseId)
      )) {
      if (deferredBase.done(now)) {
        const id = deferredBase.getItem().baseId
        const referenceCount = this.references.get(id) || 0
        if (referenceCount > 0) {
          // Skip eviction for items with reference counts greater than 0,
          // as they are still in use and should not be removed from the cache.
          continue
        }
        this.currentSize -= deferredBase.getItem().size || 0
        this.cache.delete(id)
        cleaned++
        if (this.currentSize < maxSizeBytes) {
          break
        }
      }
    }
    this.logger(
      `cleaned cache: cleaned ${cleaned}, cached ${this.cache.size}, time ${
        performance.now() - start
      }`
    )
    return
  }

  compareMaybeBasesByReferences(id1: string, id2: string): number {
    const a = this.references.get(id1)
    const b = this.references.get(id2)
    if (a === undefined && b === undefined) return 0
    if (a === undefined) return -1
    if (b === undefined) return 1
    return a - b
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
    this.cache.clear()
    this.isGathered.clear()
    this.references.clear()
  }
}
