import { DeferredBase } from './deferredBase.js'
import { CustomLogger } from '../types/functions.js'
import { Item, Base } from '../types/types.js'
import { DefermentManagerOptions } from '../core/options.js'

export class DefermentManager {
  private deferments: Map<string, DeferredBase> = new Map()
  private timer?: ReturnType<typeof setTimeout>
  private logger: CustomLogger
  private currentSize = 0
  private disposed = false
  //tracks total deferment requests for each id
  //this is used to prevent cleaning up deferments that are still being requested
  private totalDefermentRequests: Map<string, number> = new Map()
  private isGathered: Map<string, boolean> = new Map()
  private references: Map<string, number> = new Map()

  constructor(private options: DefermentManagerOptions) {
    this.resetGlobalTimer()
    this.logger = options.logger || ((): void => {})
  }

  private now(): number {
    return Date.now()
  }

  get(id: string): DeferredBase | undefined {
    if (this.disposed) throw new Error('DefermentManager is disposed')
    return this.deferments.get(id)
  }

  defer(params: { id: string }): [Promise<Base>, boolean] {
    if (this.disposed) throw new Error('DefermentManager is disposed')
    this.trackDefermentRequest(params.id)
    const now = this.now()
    const deferredBase = this.deferments.get(params.id)
    if (deferredBase) {
      deferredBase.setAccess(now)
      return [deferredBase.getPromise(), true]
    }
    const notYetFound = new DeferredBase(
      this.options.ttlms,
      params.id,
      now + this.options.ttlms
    )
    this.deferments.set(params.id, notYetFound)
    return [notYetFound.getPromise(), false]
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
              if (!this.deferments.has(value)) {
                requestItem(value)
              }
              this.references.set(value, (this.references.get(value) || 0) + 1)
            }
          }

          // Continue scanning deeper into the object's properties
          scan((item as Record<string, unknown>)[key])
        }
      }
    }

    scan(data)
  }

  trackDefermentRequest(id: string): void {
    const request = this.totalDefermentRequests.get(id)
    if (request) {
      this.totalDefermentRequests.set(id, request + 1)
    } else {
      this.totalDefermentRequests.set(id, 1)
    }
  }

  undefer(item: Item, requestItem: (id: string) => void): void {
    if (this.disposed) throw new Error('DefermentManager is disposed')
    const base = item.base
    if (!base) {
      this.logger('undefer called with no base', item)
      return
    }
    const now = this.now()
    this.currentSize += item.size || 0
    if (!this.isGathered.get(item.baseId)) {
      this.isGathered.set(item.baseId, true)
      this.scanForReferences(base, requestItem)
    }

    //order matters here with found before undefer
    const deferredBase = this.deferments.get(item.baseId)
    if (deferredBase) {
      deferredBase.found(base, item.size || 0)
      deferredBase.setAccess(now)
    } else {
      const existing = new DeferredBase(this.options.ttlms, item.baseId, now)
      existing.found(base, item.size || 0)
      this.deferments.set(item.baseId, existing)
    }
  }

  private resetGlobalTimer(): void {
    const run = (): void => {
      this.cleanDeferments()
      this.timer = setTimeout(run, this.options.ttlms)
    }
    this.timer = setTimeout(run, this.options.ttlms)
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
    this.clearDeferments()
  }

  private clearDeferments(): void {
    let waiting = 0
    for (const deferredBase of this.deferments.values()) {
      deferredBase.done(0)
      if (deferredBase.getBase() === undefined) {
        waiting++
      }
    }
    this.currentSize = 0
    this.deferments.clear()
    this.logger('cleared deferments, left', waiting)
  }

  private cleanDeferments(): void {
    const maxSizeBytes = this.options.maxSizeInMb * 1024 * 1024
    if (this.currentSize < maxSizeBytes) {
      this.logger(
        'deferments size is ok, no need to clean',
        this.currentSize,
        maxSizeBytes
      )
      return
    }
    const now = this.now()
    let cleaned = 0
    const start = performance.now()
    for (const deferredBase of Array.from(this.deferments.values())
      .filter((x) => x.isExpired(now))
      .sort((a, b) => this.compareMaybeBasesByReferences(a.getId(), b.getId()))) {
      if (deferredBase.done(now)) {
        const referenceCount = this.references.get(deferredBase.getId()) || 0
        if (referenceCount > 0) {
          //if the deferment is done but has references, we do not clean it up
          this.logger(
            'not cleaning up deferment with references',
            deferredBase.getId(),
            referenceCount
          )
          continue
        }
        //if the deferment is done but has been requested multiple times,
        //we do not clean it up to allow the requests to resolve
        const requestCount = this.totalDefermentRequests.get(deferredBase.getId())
        if (requestCount && requestCount > 1) {
          continue
        }
        this.currentSize -= deferredBase.getSize() || 0
        this.deferments.delete(deferredBase.getId())
        cleaned++
        if (this.currentSize < maxSizeBytes) {
          break
        }
      }
    }
    this.logger(
      'cleaned deferments: cleaned, left, time',
      cleaned,
      this.deferments.size,
      performance.now() - start
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

  compareMaybeBasesBySize(a: number | undefined, b: number | undefined): number {
    if (a === undefined && b === undefined) return 0
    if (a === undefined) return -1
    if (b === undefined) return 1
    return a - b
  }
}
