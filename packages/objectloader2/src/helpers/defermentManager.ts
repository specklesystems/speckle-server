import { DeferredBase } from './deferredBase.js'
import { Base, Item } from '../types/types.js'
import { Cache } from '../operations/interfaces.js'

export class DefermentManager {
  #deferments: Map<string, DeferredBase> = new Map()
  #found: Map<string, boolean> = new Map()

  constructor(
    private ttlMs: number, // Sliding TTL
    private database: Cache
  ) {
    this.resetGlobalTimer()
  }

  private now(): number {
    return Date.now()
  }

  async defer(params: { id: string }): Promise<Base> {
    const now = this.now()
    const deferredBase = this.#deferments.get(params.id)
    if (deferredBase) {
      deferredBase.lastAccess = now
      return deferredBase.promise
    }
    if (this.#found.get(params.id)) {
      console.log('got from index', params.id)
      const item = await this.database.getItem({ id: params.id })
      if (!item) {
        const waiter = new DeferredBase(params.id, now)
        this.#deferments.set(params.id, waiter)
        return waiter.promise
      }
      return item.base
    }
    const existing = new DeferredBase(params.id, now)
    this.#deferments.set(params.id, existing)
    return existing.promise
  }

  undefer(item: Item): void {
    const now = this.now()
    //order matters here with found before undefer
    const deferredBase = this.#deferments.get(item.baseId)
    if (deferredBase) {
      deferredBase.found(item.base)
      deferredBase.lastAccess = now
    } else {
      const existing = new DeferredBase(item.baseId, now)
      existing.found(item.base)
      this.#deferments.set(item.baseId, existing)
    }
  }

  private resetGlobalTimer(): void {
    const run = () => {
      this.cleanDeferments()
      setTimeout(run, this.ttlMs)
    }
    setTimeout(run, this.ttlMs)
  }

  private cleanDeferments(): void {
    const now = this.now()
    const expired = now - this.ttlMs
    this.#deferments.forEach((deferredBase, id) => {
      if (this.#found.get(id) && deferredBase.lastAccess < expired) {
        deferredBase.done()
        this.#deferments.delete(id)
      }
    })
  }

  public dispose(): void {
    this.#deferments.clear()
    this.#found.clear()
  }
}
