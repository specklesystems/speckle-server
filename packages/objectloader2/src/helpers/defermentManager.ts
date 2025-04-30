import { DeferredBase } from './deferredBase.js'
import { Base, Item } from '../types/types.js'
import { Cache } from '../operations/interfaces.js'

export class DefermentManager {
  #deferments: Map<string, DeferredBase> = new Map()
  #found: Map<string, boolean> = new Map()

  #database: Cache

  constructor(database: Cache) {
    this.#database = database
  }

  async defer(params: { id: string }): Promise<Base> {
    if (this.#found.has(params.id)) {
      const item = await this.#database.getItem({ id: params.id })
      if (item) {
        return Promise.resolve(item.base)
      }
      // If the item is not found in the database, we can resolve the promise with undefined or throw an error
      throw new Error(`Object with id ${params.id} not found in cache or database`)
    }
    const deferredBase = this.#deferments.get(params.id)
    if (deferredBase) {
      return deferredBase.promise
    }
    const d = new DeferredBase(params.id)
    this.#deferments.set(params.id, d)
    return d.promise
  }

  undefer(item: Item): void {
    //order matters here with found before undefer
    this.#found.set(item.baseId, true)
    const deferredBase = this.#deferments.get(item.baseId)
    if (deferredBase) {
      deferredBase.resolve(item.base)
      this.#deferments.delete(item.baseId)
    }
  }
}
