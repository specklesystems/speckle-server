import { DeferredBase } from './deferredBase.js'
import { CustomLogger } from '../types/functions.js'
import { Item, Base } from '../types/types.js'
import { BaseCache } from './BaseCache.js'

export class DefermentManager {
  private deferments: Map<string, DeferredBase> = new Map()
  private logger: CustomLogger
  private disposed = false
  private cache: BaseCache

  constructor(cache: BaseCache, logger: CustomLogger) {
    this.cache = cache
    this.logger = logger
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
    const item = this.cache.get(params.id)
    if (item) {
      return [Promise.resolve(item.base!), true]
    }
    const deferredBase = this.deferments.get(params.id)
    if (deferredBase) {
      return [deferredBase.getPromise(), true]
    }
    const notYetFound = new DeferredBase(
      params.id
    )
    this.deferments.set(params.id, notYetFound)
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
      if (!this.deferments.has(id)) {
        requestItem(id)
      }
    })

    //order matters here with found before undefer
    const deferredBase = this.deferments.get(item.baseId)
    if (deferredBase) {
      deferredBase.found(base, item.size || 0)
      this.deferments.delete(item.baseId)
    }
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    this.clearDeferments()
  }

  private clearDeferments(): void {
    let waiting = 0
    for (const deferredBase of this.deferments.values()) {

      if (deferredBase.getBase() === undefined) {
        waiting++
      }
    }
    this.deferments.clear()
    this.logger('cleared deferments, left', waiting)
  }
}
