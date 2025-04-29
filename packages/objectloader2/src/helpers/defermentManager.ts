import { DeferredBase } from './deferredBase.js'
import { Base, Item } from '../types/types.js'

export class DefermentManager {
  #deferments: Map<string, DeferredBase> = new Map()

  async defer(params: { id: string }): Promise<Base> {
    const deferredBase = this.#deferments.get(params.id)
    if (deferredBase) {
      return await deferredBase.promise
    }
    const d = new DeferredBase(params.id)
    this.#deferments.set(params.id, d)
    return d.promise
  }

  undefer(item: Item): void {
    const deferredBase = this.#deferments.get(item.baseId)
    if (deferredBase) {
      deferredBase.resolve(item.base)
      this.#deferments.delete(item.baseId)
    }
  }
}
