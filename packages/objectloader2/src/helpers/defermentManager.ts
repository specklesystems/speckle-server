import { DeferredBase } from './deferredBase.js'
import { Base, CustomLogger, Item } from '../types/types.js'
import { DefermentManagerOptions } from '../operations/options.js'

export class DefermentManager {
  private deferments: Map<string, DeferredBase> = new Map()
  private timer?: ReturnType<typeof setTimeout>
  private logger: CustomLogger

  constructor(private options: DefermentManagerOptions) {
    this.resetGlobalTimer()
    this.logger = options.logger || ((): void => {})
  }

  private now(): number {
    return Date.now()
  }

  isDeferred(id: string): boolean {
    return this.deferments.has(id)
  }

  get(id: string): DeferredBase | undefined {
    return this.deferments.get(id)
  }

  async defer(params: { id: string }): Promise<Base> {
    const now = this.now()
    const deferredBase = this.deferments.get(params.id)
    if (deferredBase) {
      deferredBase.setAccess(now)
      return deferredBase.getPromise()
    }
    const notYetFound = new DeferredBase(
      this.options.ttlms,
      params.id,
      now + this.options.ttlms
    )
    this.deferments.set(params.id, notYetFound)
    return notYetFound.getPromise()
  }

  undefer(item: Item): void {
    const now = this.now()
    //order matters here with found before undefer
    const deferredBase = this.deferments.get(item.baseId)
    if (deferredBase) {
      deferredBase.found(item.base)
      deferredBase.setAccess(now)
    } else {
      const existing = new DeferredBase(this.options.ttlms, item.baseId, now)
      existing.found(item.base)
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
    this.deferments.clear()
    this.logger('cleared deferments, left', waiting)
  }

  private cleanDeferments(): void {
    if (this.deferments.size < this.options.maxSize) {
      return
    }
    const now = this.now()
    let cleaned = 0
    const start = performance.now()
    for (const deferredBase of Array.from(this.deferments.values())
      .filter((x) => x.isExpired(now))
      .sort((a, b) => this.compareMaybeBasesByClosureCount(a.getBase(), b.getBase()))) {
      if (deferredBase.done(now)) {
        this.deferments.delete(deferredBase.getId())
        cleaned++
        if (this.deferments.size < this.options.maxSize) {
          break
        }
      }
    }
    this.logger(
      'cleaned deferments, cleaned, left',
      cleaned,
      this.deferments.size,
      performance.now() - start
    )
    return
  }

  compareMaybeBasesByClosureCount(a: Base | undefined, b: Base | undefined): number {
    if (a === undefined && b === undefined) return 0
    if (a === undefined) return -1
    if (b === undefined) return 1
    return this.compareMaybe(a.__closure?.length, b.__closure?.length)
  }

  compareMaybe(a: number | undefined, b: number | undefined): number {
    if (a === undefined && b === undefined) return 0
    if (a === undefined) return -1
    if (b === undefined) return 1
    return a - b
  }
}
