import { DeferredBase } from './deferredBase.js'
import { CustomLogger } from '../types/functions.js'
import { Item, Base } from '../types/types.js'
import { MemoryCache } from './MemoryCache.js'

export class DefermentManager {
  private outstanding: Map<string, DeferredBase> = new Map()
  private logger: CustomLogger
  private disposed = false
  private cache: MemoryCache
  private requestItem: (id: string) => void

  constructor(
    cache: MemoryCache,
    logger: CustomLogger,
    requestItem: (id: string) => void
  ) {
    this.cache = cache
    this.logger = logger
    this.requestItem = requestItem
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

  undefer(item: Item): void {
    if (this.disposed) throw new Error('DefermentManager is disposed')
    const base = item.base
    if (!base) {
      this.logger('undefer called with no base', item)
      return
    }
    this.cache.add(item, (id) => {
      if (!this.outstanding.has(id)) {
        this.requestItem(id)
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
  }
}
