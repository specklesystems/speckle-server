import { DefermentManager } from '../../deferment/defermentManager.js'
import BatchingQueue from '../../queues/batchingQueue.js'
import { CustomLogger } from '../../types/functions.js'
import { Item } from '../../types/types.js'
import { Database } from '../interfaces.js'
import { CacheOptions } from '../options.js'
import { Writer } from './interfaces.js'

export class CacheWriter implements Writer{
  #writeQueue: BatchingQueue<Item> | undefined
  #database: Database
  #defermentManager: DefermentManager
  #requestItem: (id: string) => void
  #logger: CustomLogger
  #options: CacheOptions
  #disposed = false

  constructor(
    database: Database,
    logger: CustomLogger,
    defermentManager: DefermentManager,
    options: CacheOptions,
    requestItem: (id: string) => void
  ) {
    this.#database = database
    this.#options = options
    this.#logger = logger
    this.#defermentManager = defermentManager
    this.#requestItem = requestItem
  }

  async add(item: Item): Promise<void> {
    if (!this.#writeQueue) {
      this.#writeQueue = new BatchingQueue({
        batchSize: this.#options.maxCacheWriteSize,
        maxWaitTime: this.#options.maxCacheBatchWriteWait,
        processFunction: async (batch: Item[]): Promise<void> => {
          await this.writeAll(batch)
        }
      })
    }
    await this.#writeQueue.add(item.baseId, item)
    this.#defermentManager.undefer(item, this.#requestItem)
  }

  async writeAll(items: Item[]): Promise<void> {
    const start = performance.now()
    await this.#database.saveBatch({ batch: items })
    this.#logger(
      `writeBatch: wrote ${items.length}, time ${
        performance.now() - start
      } ms left ${this.#writeQueue?.count()}`
    )
  }

  async disposeAsync(): Promise<void> {
    this.#disposed = true
    await this.#writeQueue?.disposeAsync()
  }

  get isDisposed(): boolean {
    return this.#disposed
  }
}
