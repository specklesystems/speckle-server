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
  #logger: CustomLogger
  #options: CacheOptions
  #disposed = false

  constructor(
    database: Database,
    defermentManager: DefermentManager,
    options: CacheOptions
  ) {
    this.#database = database
    this.#defermentManager = defermentManager
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
    this.#defermentManager.undefer(item)
    this.#writeQueue.add(item.baseId, item)
  }

  async disposeAsync(): Promise<void> {
    this.#writeQueue?.dispose()
    this.#disposed = true
    return Promise.resolve()
  }

  get isDisposed(): boolean {
    return this.#disposed
  }
}
