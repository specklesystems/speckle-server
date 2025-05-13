import { Database } from '../operations/interfaces.js'
import { CacheOptions } from '../operations/options.js'
import { Base, CustomLogger, Item } from '../types/types.js'
import BatchingQueue from './batchingQueue.js'
import { DefermentManager } from './defermentManager.js'

export class CacheReader {
  #database: Database
  #defermentManager: DefermentManager
  #logger: CustomLogger
  #options: CacheOptions
  #readQueue: BatchingQueue<string> | undefined

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

  async getObject(params: { id: string }): Promise<Base> {
    if (!this.#defermentManager.isDeferred(params.id)) {
      this.#getItem(params.id)
    }
    return await this.#defermentManager.defer({ id: params.id })
  }

  #getItem(id: string): void {
    if (!this.#readQueue) {
      this.#readQueue = new BatchingQueue({
        batchSize: this.#options.maxCacheReadSize,
        maxWaitTime: this.#options.maxCacheBatchReadWait,
        processFunction: this.#processBatch
      })
    }
    if (!this.#readQueue.get(id)) {
      this.#readQueue.add(id, id)
    }
  }

  async getAll(keys: string[]): Promise<(Item | undefined)[]> {
    return this.#database.getAll(keys)
  }

  #processBatch = async (batch: string[]): Promise<void> => {
    const items = await this.#database.getAll(batch)
    for (let i = 0; i < items.length; i++) {
      if (items[i]) {
        this.#defermentManager.undefer(items[i]!)
      } else {
        //this is okay!
        //this.#logger(`Item ${batch[i]} not found in cache`)
      }
    }
  }

  async disposeAsync(): Promise<void> {
    await this.#readQueue?.disposeAsync()
  }
}
