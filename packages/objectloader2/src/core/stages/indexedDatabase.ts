/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { CustomLogger } from '../../types/functions.js'
import { Item } from '../../types/types.js'
import { Database } from '../interfaces.js'
import BatchingQueue from '../../queues/batchingQueue.js'
import { ItemStore } from './ItemStore.js'

export interface IndexedDatabaseOptions {
  logger?: CustomLogger
  indexedDB?: IDBFactory
  keyRange?: {
    bound: Function
    lowerBound: Function
    upperBound: Function
  }
}

export default class IndexedDatabase implements Database {
  #options: IndexedDatabaseOptions
  #logger: CustomLogger

  #cacheDB: ItemStore

  #writeQueue: BatchingQueue<Item> | undefined

  // #count: number = 0

  constructor(options: IndexedDatabaseOptions) {
    this.#options = options
    this.#logger = options.logger || ((): void => {})
    this.#cacheDB = new ItemStore(
      {
        indexedDB: this.#options.indexedDB,
        keyRange: this.#options.keyRange
      },
      this.#logger,
      'speckle-cache',
      'objects'
    )
  }

  async getAll(keys: string[]): Promise<Item[]> {
    await this.#cacheDB.init()
    return await this.#cacheDB.bulkGet(keys)
  }

  async saveBatch(params: { batch: Item[] }): Promise<void> {
    await this.#cacheDB.init()
    const { batch } = params
    //const x = this.#count
    //this.#count++

    // const startTime = performance.now()
    //  this.#logger('Start save ' + x + ' ' + batch.length)
    await this.#cacheDB.bulkInsert(batch)
    // const endTime = performance.now()
    // const duration = endTime - startTime
    //this.#logger('Saved batch ' + x + ' ' + batch.length + ' ' + duration / TIME_MS.second)
  }

  async disposeAsync(): Promise<void> {
    await this.#writeQueue?.disposeAsync()
    this.#writeQueue = undefined
  }
}
