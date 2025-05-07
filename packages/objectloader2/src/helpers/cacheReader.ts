import IndexedDatabase from '../operations/indexedDatabase.js'
import { CustomLogger, Item } from '../types/types.js'
import BatchingQueue from './batchingQueue.js'
import { DefermentManager } from './defermentManager.js'

export class CacheReader {
  #database: IndexedDatabase
  #defermentManager: DefermentManager
  #logger: CustomLogger
  #readQueue: BatchingQueue<string> | undefined

  constructor(
    database: IndexedDatabase,
    defermentManager: DefermentManager,
    logger: CustomLogger
  ) {
    this.#database = database
    this.#defermentManager = defermentManager
    this.#logger = logger
  }

  getItem(id: string): void {
    if (!this.#readQueue) {
      this.#readQueue = new BatchingQueue({
        batchSize: 5_000,
        maxWaitTime: 5_000,
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
        this.#logger(`Item ${batch[i]} not found in cache`)
      }
    }
  }

  async disposeAsync(): Promise<void> {
    await this.#readQueue?.disposeAsync()
  }
}
