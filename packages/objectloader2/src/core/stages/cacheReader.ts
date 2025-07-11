import { DefermentManager } from '../../deferment/defermentManager.js'
import BatchingQueue from '../../queues/batchingQueue.js'
import Queue from '../../queues/queue.js'
import { CustomLogger } from '../../types/functions.js'
import { Item, Base } from '../../types/types.js'
import { Database } from '../interfaces.js'
import { CacheOptions } from '../options.js'

export class CacheReader {
  #database: Database
  #defermentManager: DefermentManager
  #logger: CustomLogger
  #options: CacheOptions
  #readQueue: BatchingQueue<string> | undefined
  #foundQueue: Queue<Item> | undefined
  #notFoundQueue: Queue<string> | undefined

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

  initializeQueue(foundQueue: Queue<Item>, notFoundQueue: Queue<string>): void {
    this.#foundQueue = foundQueue
    this.#notFoundQueue = notFoundQueue
  }

  getObject(params: { id: string }): Promise<Base> {
    const [p, b] = this.#defermentManager.defer({ id: params.id })
    if (!b) {
      this.#requestItem(params.id)
    }
    return p
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
    for (const key of keys) {
      this.#defermentManager.trackDefermentRequest(key)
    }

    this.#readQueue?.addAll(keys, keys)
  }

  #processBatch = async (batch: string[]): Promise<void> => {
    const start = performance.now()
    const items = await this.#database.getAll(batch)
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item) {
        this.#foundQueue?.add(item)
        this.#defermentManager.undefer(item)
      } else {
        this.#notFoundQueue?.add(batch[i])
      }
    }
    this.#logger('readBatch: left, time', items.length, performance.now() - start)
  }

  dispose(): void {
    this.#readQueue?.dispose()
  }
}
