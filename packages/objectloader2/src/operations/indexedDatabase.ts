import BatchingQueue from '../helpers/batchingQueue.js'
import Queue from '../helpers/queue.js'
import { CustomLogger, Item } from '../types/types.js'
import { isSafari } from '@speckle/shared'
import { BaseDatabaseOptions } from './options.js'
import { Cache } from './interfaces.js'
import { Dexie, DexieOptions, Table } from 'dexie'

class ObjectStore extends Dexie {
  static #databaseName: string = 'speckle-cache'
  objects!: Table<Item, string> // Table type: <entity, primaryKey>

  constructor(options: DexieOptions) {
    super(ObjectStore.#databaseName, options)

    this.version(1).stores({
      objects: 'baseId' // baseId is primary key
    })
  }
}

export default class IndexedDatabase implements Cache {
  #options: BaseDatabaseOptions
  #logger: CustomLogger

  #cacheDB?: ObjectStore

  #writeQueue: BatchingQueue | undefined

  // #count: number = 0

  constructor(options: BaseDatabaseOptions) {
    this.#options = {
      ...{
        maxCacheReadSize: 10000,
        maxCacheBatchWriteWait: 1000
      },
      ...options
    }
    this.#logger = options.logger || (() => {})
  }

  async add(item: Item): Promise<void> {
    if (!this.#writeQueue) {
      await this.#setupCacheDb()
      this.#writeQueue = new BatchingQueue({
        batchSize: this.#options.maxCacheWriteSize ?? 10000,
        maxWaitTime: this.#options.maxCacheBatchWriteWait,
        processFunction: (batch: Item[]) =>
          this.#cacheSaveBatch({ batch, cacheDB: this.#cacheDB! })
      })
    }
    this.#writeQueue.add(item)
  }

  async disposeAsync(): Promise<void> {
    await this.#writeQueue?.disposeAsync()
  }

  async #openDatabase(): Promise<ObjectStore> {
    const db = new ObjectStore({
      indexedDB: this.#options.indexedDB ?? globalThis.indexedDB,
      IDBKeyRange: this.#options.keyRange ?? IDBKeyRange,
      chromeTransactionDurability: 'relaxed'
    })
    await db.open()
    return db
  }

  async #setupCacheDb(): Promise<void> {
    if (this.#cacheDB !== undefined) {
      return
    }

    // Initialize
    await this.#safariFix()
    this.#cacheDB = await this.#openDatabase()
  }

  async processItems(params: {
    ids: string[]
    foundItems: Queue<Item>
    notFoundItems: Queue<string>
  }): Promise<void> {
    const { ids, foundItems, notFoundItems } = params
    await this.#setupCacheDb()
    const maxCacheReadSize = this.#options.maxCacheReadSize ?? 10000

    for (let i = 0; i < ids.length; ) {
      if ((this.#writeQueue?.count() ?? 0) > maxCacheReadSize * 2) {
        this.#logger(
          'pausing reads (# in write queue: ' + this.#writeQueue?.count() + ')'
        )
        await new Promise((resolve) => setTimeout(resolve, 1000)) // Pause for 1 second, protects against out of memory
        continue
      }
      const batch = ids.slice(i, i + maxCacheReadSize)
      //   const x = this.#count
      //   this.#count++
      //  const startTime = performance.now()
      // this.#logger('Start read ' + x + ' ' + batch.length)

      //faster than BulkGet with dexie
      await this.#cacheDB!.transaction('r', this.#cacheDB!.objects, async () => {
        const gets = batch.map((key) => this.#cacheDB!.objects.get(key))
        const cachedData = await Promise.all(gets)
        for (let i = 0; i < cachedData.length; i++) {
          if (cachedData[i]) {
            foundItems.add(cachedData[i]!)
          } else {
            notFoundItems.add(batch[i])
          }
        }
      })
      // const endTime = performance.now()
      // const duration = endTime - startTime
      // this.#logger('Read batch ' + x + ' ' + batch.length + ' ' + duration / 1000)

      // interate down here to help with pausing
      i += maxCacheReadSize
    }
  }

  async getItem(params: { id: string }): Promise<Item | undefined> {
    const { id } = params
    await this.#setupCacheDb()
    const itemToBeWritten = this.#writeQueue?.get(id)
    if (itemToBeWritten) {
      return itemToBeWritten
    }
    return this.#cacheDB!.transaction('r', this.#cacheDB!.objects, async () => {
      return await this.#cacheDB?.objects.get(id)
    })
  }

  async #cacheSaveBatch(params: {
    batch: Item[]
    cacheDB: ObjectStore
  }): Promise<void> {
    const { batch, cacheDB } = params
    //const x = this.#count
    //this.#count++

    // const startTime = performance.now()
    //  this.#logger('Start save ' + x + ' ' + batch.length)
    await cacheDB.objects.bulkPut(batch)
    // const endTime = performance.now()
    // const duration = endTime - startTime
    //this.#logger('Saved batch ' + x + ' ' + batch.length + ' ' + duration / 1000)
  }

  /**
   * Fixes a Safari bug where IndexedDB requests get lost and never resolve - invoke before you use IndexedDB
   * @link Credits and more info: https://github.com/jakearchibald/safari-14-idb-fix
   */
  async #safariFix(): Promise<void> {
    // No point putting other browsers or older versions of Safari through this mess.
    if (!isSafari() || !this.#options.indexedDB?.databases) return Promise.resolve()

    let intervalId: ReturnType<typeof setInterval>

    return new Promise<void>((resolve: () => void) => {
      const tryIdb = () => this.#options.indexedDB?.databases().finally(resolve)
      intervalId = setInterval(() => {
        void tryIdb()
      }, 100)
      void tryIdb()
    }).finally(() => clearInterval(intervalId))
  }
}
