import { DeferredBase } from './deferredBase.js'
import { CustomLogger } from '../types/functions.js'
import { Item, Base } from '../types/types.js'
import { MemoryCache } from './MemoryCache.js'

export interface Deferment {
  defer(params: { id: string }): [Promise<Base>, boolean]
  undefer(item: Item, requestItem: (id: string) => void): void
  dispose(): void
}

export class MemoryOnlyDeferment implements Deferment {
  private items: Map<string, Base>

  constructor(items: Map<string, Base>) {
    this.items = items
  }
  defer(params: { id: string }): [Promise<Base>, boolean] {
    const item = this.items.get(params.id)
    if (item) {
      return [Promise.resolve(item), true]
    }
    return [Promise.reject(new Error('Not found in cache: ' + params.id)), false]
  }
  undefer(): void {
    //no-op
  }
  dispose(): void {
    //no-op
  }
}

export class DefermentManager implements Deferment {
  private outstanding: Map<string, DeferredBase> = new Map()
  private logger: CustomLogger
  private disposed = false
  private cache: MemoryCache

  constructor(logger: CustomLogger, cache?: MemoryCache) {
    this.logger = logger
    this.cache =
      cache ||
      new MemoryCache(
        {
          maxSizeInMb: 500, // 500 MB
          ttlms: 5_000 // 5 seconds
        },
        logger
      )
  }

  defer(params: { id: string }): [Promise<Base>, boolean] {
    if (this.disposed) throw new Error('DefermentManager is disposed')
    const item = this.cache.get(params.id)
    if (item) {
      return [Promise.resolve(item.base!), true]
    }
    const deferredBase = this.outstanding.get(params.id)
    if (deferredBase) {
      return [deferredBase.getPromise(), true]
    }
    const notYetFound = new DeferredBase(params.id)
    this.outstanding.set(params.id, notYetFound)
    return [notYetFound.getPromise(), false]
  }

  undefer(item: Item, requestItem: (id: string) => void): void {
    if (this.disposed) throw new Error('DefermentManager is disposed')
    const base = item.base
    if (!base) {
      this.logger('undefer called with no base', item)
      return
    }
    this.cache.add(item, (id) => {
      if (!this.outstanding.has(id)) {
        requestItem(id)
      }
    })

    //order matters here with found before undefer
    const deferredBase = this.outstanding.get(item.baseId)
    if (deferredBase) {
      deferredBase.found(base)
      this.outstanding.delete(item.baseId)
    }
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.logger('cleared deferments, left', this.outstanding.size)
    this.outstanding.clear()
    this.cache.dispose()
  }
}
