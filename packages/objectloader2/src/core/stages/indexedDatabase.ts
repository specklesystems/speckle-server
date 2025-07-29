/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { Item } from '../../types/types.js'
import { Database } from '../interfaces.js'
import BatchingQueue from '../../queues/batchingQueue.js'
import { ItemStore } from './ItemStore.js'

export interface IndexedDatabaseOptions {
  indexedDB?: IDBFactory
  keyRange?: {
    bound: Function
    lowerBound: Function
    upperBound: Function
  }
}

export default class IndexedDatabase implements Database {
  #options: IndexedDatabaseOptions
  #cacheDB: ItemStore
  #writeQueue: BatchingQueue<Item> | undefined

  constructor(options: IndexedDatabaseOptions) {
    this.#options = options
    this.#cacheDB = new ItemStore(
      {
        indexedDB: this.#options.indexedDB,
        keyRange: this.#options.keyRange
      },
      'speckle-cache',
      'cache'
    )
  }

  async getAll(keys: string[]): Promise<(Item | undefined)[]> {
    await this.#cacheDB.init()
    return await this.#cacheDB.bulkGet(keys)
  }

  async saveBatch(params: { batch: Item[] }): Promise<void> {
    await this.#cacheDB.init()
    const { batch } = params
    await this.#cacheDB.bulkInsert(batch)
  }

  async disposeAsync(): Promise<void> {
    await this.#writeQueue?.disposeAsync()
    this.#writeQueue = undefined
    this.#cacheDB.close()
  }
}
