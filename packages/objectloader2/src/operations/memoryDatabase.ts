import Queue from '../helpers/queue.js'
import { Base, Item } from '../types/types.js'
import { Cache } from './interfaces.js'
import { MemoryDatabaseOptions } from './options.js'

export class MemoryDatabase implements Cache {
  #items: Record<string, Base>
  constructor(options?: MemoryDatabaseOptions) {
    this.#items = options?.items || {}
  }

  getItem(params: { id: string }): Promise<Item | undefined> {
    const item = this.#items[params.id]
    if (item) {
      return Promise.resolve({ baseId: params.id, base: item })
    }
    return Promise.resolve(undefined)
  }
  processItems(params: {
    ids: string[]
    foundItems: Queue<Item>
    notFoundItems: Queue<string>
  }): Promise<void> {
    const { ids, foundItems, notFoundItems } = params
    for (const id of ids) {
      const item = this.#items[id]
      if (item) {
        foundItems.add({ baseId: id, base: item })
      } else {
        notFoundItems.add(id)
      }
    }
    return Promise.resolve()
  }
  add(item: Item): Promise<void> {
    this.#items[item.baseId] = item.base
    return Promise.resolve()
  }
  disposeAsync(): Promise<void> {
    return Promise.resolve()
  }
}
