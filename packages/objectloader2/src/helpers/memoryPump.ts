import { Item } from '../types/types.js'
import { Pump } from './pump.js'
import Queue from './queue.js'

export class MemoryPump implements Pump {
  #items: Map<string, Item> = new Map()

  add(item: Item): void {
    this.#items.set(item.baseId, item)
  }

  async pumpItems(params: {
    ids: string[]
    foundItems: Queue<Item>
    notFoundItems: Queue<string>
  }): Promise<void> {
    const { ids, foundItems, notFoundItems } = params
    for (const id of ids) {
      const item = this.#items.get(id)
      if (item) {
        foundItems.add(item)
      } else {
        notFoundItems.add(id)
      }
    }
    return Promise.resolve()
  }

  async *gather(ids: string[]): AsyncGenerator<Item> {
    for (const id of ids) {
      const item = this.#items.get(id)
      if (item) {
        yield item
      }
    }
    return Promise.resolve()
  }

  async disposeAsync(): Promise<void> {}
}
