import { Base, Item } from '../../types/types.js'
import { Database } from '../interfaces.js'
import { MemoryDatabaseOptions } from '../options.js'

export class MemoryDatabase implements Database {
  private items: Map<string, Base>

  constructor(options?: MemoryDatabaseOptions) {
    this.items = options?.items || new Map<string, Base>()
  }

  getAll(keys: string[]): Promise<(Item | undefined)[]> {
    const found: (Item | undefined)[] = []
    for (const key of keys) {
      const item = this.items.get(key)
      if (item) {
        found.push({ baseId: key, base: item })
      } else {
        found.push(undefined)
      }
    }
    return Promise.resolve(found)
  }

  cacheSaveBatch({ batch }: { batch: Item[] }): Promise<void> {
    for (const item of batch) {
      this.items.set(item.baseId, item.base)
    }
    return Promise.resolve()
  }

  getItem(params: { id: string }): Promise<Item | undefined> {
    const item = this.items.get(params.id)
    if (item) {
      return Promise.resolve({ baseId: params.id, base: item })
    }
    return Promise.resolve(undefined)
  }

  disposeAsync(): Promise<void> {
    return Promise.resolve()
  }
}
