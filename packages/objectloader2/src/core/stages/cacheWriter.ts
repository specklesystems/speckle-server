import { DefermentManager } from '../../deferment/defermentManager.js'
import BatchingQueue from '../../queues/batchingQueue.js'
import Queue from '../../queues/queue.js'
import { CustomLogger } from '../../types/functions.js'
import { Item } from '../../types/types.js'
import { Database } from '../interfaces.js'
import { CacheOptions } from '../options.js'

export class CacheWriter implements Queue<Item> {
  #writeQueue: BatchingQueue<Item> | undefined
  #database: Database
  #defermentManager: DefermentManager
  #requestItem: (id: string) => void
  #logger: CustomLogger
  #options: CacheOptions
  #disposed = false

  constructor(
    database: Database,
    options: CacheOptions,
    defermentManager: DefermentManager,
    requestItem: (id: string) => void
  ) {
    this.#database = database
    this.#options = options
    this.#logger = options.logger || ((): void => {})
    this.#defermentManager = defermentManager
    this.#requestItem = requestItem
  }

  add(item: Item): void {
    if (!this.#writeQueue) {
      this.#writeQueue = new BatchingQueue({
        batchSize: this.#options.maxCacheWriteSize,
        maxWaitTime: this.#options.maxCacheBatchWriteWait,
        processFunction: async (batch: Item[]): Promise<void> => {
          await this.writeAll(batch)
        }
      })
    }
    this.#writeQueue.add(item.baseId, item)
    this.#defermentManager.undefer(item, this.#requestItem)
  }
  addAll(): void {
   throw new Error('Method not implemented. Use add instead.')
  }

  async writeAll(items: Item[]): Promise<void> {
    const start = performance.now()
    await this.#database.saveBatch({ batch: items })
    this.#logger('writeBatch: left, time', items.length, performance.now() - start)
  }

  async disposeAsync(): Promise<void> {
    this.#disposed = true
    await this.#writeQueue?.disposeAsync()
  }

  get isDisposed(): boolean {
    return this.#disposed
  }
}
