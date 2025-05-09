import { DeferredBase } from './deferredBase.js'
import { Base, CustomLogger, Item } from '../types/types.js'
import { DefermentManagerOptions } from '../operations/options.js'

export class DefermentManager {
  #deferments: Map<string, DeferredBase> = new Map()
  #timer?: ReturnType<typeof setTimeout>
  #logger: CustomLogger

  constructor(private options: DefermentManagerOptions) {
    this.resetGlobalTimer()
    this.#logger = options.logger || (() => {})
  }

  private now(): number {
    return Date.now()
  }

  isDeferred(id: string): boolean {
    return this.#deferments.has(id)
  }
  async defer(params: { id: string }): Promise<Base> {
    const now = this.now()
    const deferredBase = this.#deferments.get(params.id)
    if (deferredBase) {
      deferredBase.lastAccess = now
      return deferredBase.promise
    }
    const notYetFound = new DeferredBase(params.id, now)
    this.#deferments.set(params.id, notYetFound)
    return notYetFound.promise
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
      this.#timer = setTimeout(run, this.options.ttl)
    }
    this.#timer = setTimeout(run, this.options.ttl)
  }

  dispose(): void {
    if (this.#timer) {
      clearTimeout(this.#timer)
      this.#timer = undefined
    }
    this.#deferments.clear()
  }

  private cleanDeferments(): void {
    const now = this.now()
    const expired = now - this.options.ttl
    let cleaned = 0

    if (this.#deferments.size < this.options.maxSize) {
      this.#logger('cleaned deferments', cleaned, this.#deferments.size)
      return
    }
    for (const [id, deferredBase] of this.#deferments) {
      if (deferredBase.done(expired)) {
        this.#deferments.delete(id)
        cleaned++
        if (this.#deferments.size < this.options.maxSize) {
          this.#logger('cleaned deferments', cleaned, this.#deferments.size)
          return
        }
      }
    }
  }
}
