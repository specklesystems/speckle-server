import { DeferredBase } from './deferredBase.js'
import { Base, CustomLogger, Item } from '../types/types.js'
import { DefermentManagerOptions } from '../operations/options.js'

export class DefermentManager {
  private deferments: Map<string, DeferredBase> = new Map()
  private timer?: ReturnType<typeof setTimeout>
  private logger: CustomLogger
  private currentSize = 0
  private disposed = false

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
    if (this.disposed) throw new Error('DefermentManager is disposed')
    return this.deferments.get(id)
  }

  async defer(params: { id: string }): Promise<Base> {
    if (this.disposed) throw new Error('DefermentManager is disposed')
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
    if (this.disposed) throw new Error('DefermentManager is disposed')
    const now = this.now()
    this.currentSize += item.size || 0
    //order matters here with found before undefer
    const deferredBase = this.deferments.get(item.baseId)
    if (deferredBase) {
      deferredBase.found(item)
      deferredBase.setAccess(now)
    } else {
      const existing = new DeferredBase(this.options.ttlms, item.baseId, now)
      existing.found(item)
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
      if (deferredBase.getItem() === undefined) {
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
      .sort((a, b) => this.compareMaybeBasesBySize(a.getItem(), b.getItem()))) {
      if (deferredBase.done(now)) {
        this.currentSize -= deferredBase.getItem()?.size || 0
        this.deferments.delete(deferredBase.getId())
        cleaned++
        if (this.currentSize < maxSizeBytes) {
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

  compareMaybeBasesBySize(a: Item | undefined, b: Item | undefined): number {
    if (a === undefined && b === undefined) return 0
    if (a === undefined) return -1
    if (b === undefined) return 1
    return this.compareMaybe(a.size, b.size)
  }

  compareMaybe(a: number | undefined, b: number | undefined): number {
    if (a === undefined && b === undefined) return 0
    if (a === undefined) return -1
    if (b === undefined) return 1
    return a - b
  }
}
