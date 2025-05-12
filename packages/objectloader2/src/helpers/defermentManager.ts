import { DeferredBase } from './deferredBase.js'
import { Base, Item } from '../types/types.js'

export class DefermentManager {
  #deferments: DeferredBase[] = []

  async defer(params: { id: string }): Promise<Base> {
    const deferredBase = this.#deferments.find((x) => x.id === params.id)
    if (deferredBase) {
      return await deferredBase.promise
    }
    const d = new DeferredBase(params.id)
    this.#deferments.push(d)
    return d.promise
  }

  undefer(item: Item): void {
    const deferredIndex = this.#deferments.findIndex((x) => x.id === item.baseId)
    if (deferredIndex !== -1) {
      const deferredBase = this.#deferments[deferredIndex]
      deferredBase.resolve(item.base)
      this.#deferments.splice(deferredIndex, 1)
    }
  }
}
