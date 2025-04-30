import { DeferredBase } from './deferredBase.js'
import { Base, Item } from '../types/types.js'
import { Cache } from '../operations/interfaces.js'

export class DefermentManager {
  #deferments: Map<string, DeferredBase> = new Map()
  // #found: Map<string, boolean> = new Map()

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
    const item = await this.database.getItem({ id: params.id })
    if (!item) {
      const waiter = new DeferredBase(params.id, now)
      this.#deferments.set(params.id, waiter)
      return waiter.promise
    }
    const existing = new DeferredBase(params.id, now)
    existing.resolve(item.base)
    this.#deferments.set(params.id, existing)
    return existing.promise
  }

  undefer(item: Item): void {
    //order matters here with found before undefer
    //  this.#found.set(item.baseId, true)
    const deferredBase = this.#deferments.get(item.baseId)
    if (deferredBase) {
      const now = this.now()
      deferredBase.resolve(item.base)
      deferredBase.lastAccess = now
    }
  }

  private resetGlobalTimer():void {
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
        if (deferredBase.lastAccess < expired) {
          this.#deferments.delete(id)
        }
      })
  }
}
