import { initializeQueue } from '@speckle/shared/queue'
import { Database } from '../operations/interfaces.js'
import { CacheOptions } from '../operations/options.js'
import { Base, CustomLogger, Item } from '../types/types.js'
import BatchingQueue from './batchingQueue.js'
import { DefermentManager } from './defermentManager.js'
import Queue from './queue.js'

export class CacheReader {
  #database: Database
  #defermentManager: DefermentManager
  #logger: CustomLogger
  #options: CacheOptions
  #readQueue: BatchingQueue<string> | undefined
  #outputQueue: Queue<Item> | undefined

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

  initializeQueue(results: Queue<Item>): void {
    this.#outputQueue = results
  }

  async getObject(params: { id: string }): Promise<Base> {
    if (!this.#defermentManager.isDeferred(params.id)) {
      this.#requestItem(params.id)
    }
    return await this.#defermentManager.defer({ id: params.id })
  }

  #createReadQueue(): void {
    if (!this.#readQueue) {
      this.#readQueue = new BatchingQueue({
        batchSize: this.#options.maxCacheReadSize,
        maxWaitTime: this.#options.maxCacheBatchReadWait,
        processFunction: this.#processBatch
      })
    }
  }

  #requestItem(id: string): void {
    this.#createReadQueue()
    if (!this.#readQueue?.get(id)) {
      this.#readQueue?.add(id, id)
    }
  }

  requestAll(keys: string[]): void {
    this.#createReadQueue()
    this.#readQueue?.addAll(keys, keys)
  }

  #processBatch = async (batch: string[]): Promise<void> => {
    const items = await this.#database.getAll(batch)
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item) {
        this.#outputQueue?.add(item)
        this.#defermentManager.undefer(item)
      } else {
        this.#outputQueue?.add({ baseId: batch[i] })
      }
    }
  }
}
