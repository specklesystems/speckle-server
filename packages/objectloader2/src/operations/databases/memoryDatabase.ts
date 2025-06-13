import { Base, Item } from '../../types/types.js'
import { Database } from '../interfaces.js'
import { MemoryDatabaseOptions } from '../options.js'

export class MemoryDatabase implements Database {
  private items: Map<string, Base>
  private disposed: boolean = false

  constructor(options?: MemoryDatabaseOptions) {
    this.items = options?.items || new Map<string, Base>()
  }
  initializeQueues(): Promise<void> {
    throw new Error('Method not implemented.')
  }
  findBatch(): Promise<void> {
    throw new Error('Method not implemented.')
  }
  isDisposed(): boolean {
    return this.disposed;
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
      this.items.set(item.baseId, item.base!)
    }
    return Promise.resolve()
  }

  disposeAsync(): Promise<void> {
    this.disposed = true;
    return Promise.resolve()
  }
}
