import { Database } from '../operations/interfaces.js'
import { CacheOptions } from '../operations/options.js'
import { CustomLogger, Item } from '../types/types.js'
import BatchingQueue from './batchingQueue.js'
import Queue from './queue.js'

export class CacheWriter implements Queue<Item> {
  #writeQueue: BatchingQueue<Item> | undefined
  #database: Database
  #logger: CustomLogger
  #options: CacheOptions
  #disposed = false

  constructor(database: Database, options: CacheOptions) {
    this.#database = database
    this.#options = options
    this.#logger = options.logger || ((): void => {})
  }

  add(item: Item): void {
    if (!this.#writeQueue) {
      this.#writeQueue = new BatchingQueue({
        batchSize: this.#options.maxCacheWriteSize,
        maxWaitTime: this.#options.maxCacheBatchWriteWait,
        processFunction: (batch: Item[]): Promise<void> =>
          this.#database.saveBatch({ batch })
      })
    }
    this.#writeQueue.add(item.baseId, item)
  }

  async disposeAsync(): Promise<void> {
    await this.#writeQueue?.disposeAsync()
    await this.#database.disposeAsync()
    this.#disposed = true
  }

  get isDisposed(): boolean {
    return this.#disposed
  }
}
