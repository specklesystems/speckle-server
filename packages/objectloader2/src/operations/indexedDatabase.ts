import BatchingQueue from '../helpers/batchingQueue.js'
import { CustomLogger, Item } from '../types/types.js'
import { isSafari } from '@speckle/shared'
import { BaseDatabaseOptions } from './options.js'
import { Dexie, DexieOptions, Table } from 'dexie'

class ObjectStore extends Dexie {
  static #databaseName: string = 'speckle-cache'
  objects!: Table<Item, string> // Table type: <entity, primaryKey>

  constructor(options: DexieOptions) {
    super(ObjectStore.#databaseName, options)

    this.version(1).stores({
      objects: 'baseId, item' // baseId is primary key
    })
  }
}

export interface Database {
  getAll(keys: string[]): Promise<(Item | undefined)[]>
  getItem(params: { id: string }): Promise<Item | undefined>
  cacheSaveBatch(params: { batch: Item[] }): Promise<void>
  disposeAsync(): Promise<void>
}

export default class IndexedDatabase implements Database {
  #options: BaseDatabaseOptions
  #logger: CustomLogger

  #cacheDB?: ObjectStore

  #writeQueue: BatchingQueue<Item> | undefined

  // #count: number = 0

  constructor(options: BaseDatabaseOptions) {
    this.#options = options
    this.#logger = options.logger || (() => {})
  }

  async getAll(keys: string[]): Promise<(Item | undefined)[]> {
    await this.#setupCacheDb()
    let items: (Item | undefined)[] = []
    //   this.#count++
    //  const startTime = performance.now()
    // this.#logger('Start read ' + x + ' ' + batch.length)

    //faster than BulkGet with dexie
    await this.#cacheDB!.transaction('r', this.#cacheDB!.objects, async () => {
      const gets = keys.map((key) => this.#cacheDB!.objects.get(key))
      const cachedData = await Promise.all(gets)
      items = cachedData
    })
    // const endTime = performance.now()
    // const duration = endTime - startTime
    //this.#logger('Saved batch ' + x + ' ' + batch.length + ' ' + duration / TIME_MS.second)

    return items
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

  async getItem(params: { id: string }): Promise<Item | undefined> {
    const { id } = params
    await this.#setupCacheDb()
    //might not be in the real DB yet, so check the write queue first
    if (this.#writeQueue) {
      const item = this.#writeQueue.get(id)
      if (item) {
        return item
      }
    }

    return this.#cacheDB!.transaction('r', this.#cacheDB!.objects, async () => {
      return await this.#cacheDB?.objects.get(id)
    })
  }

  async cacheSaveBatch(params: { batch: Item[] }): Promise<void> {
    await this.#setupCacheDb()
    const { batch } = params
    //const x = this.#count
    //this.#count++

    // const startTime = performance.now()
    //  this.#logger('Start save ' + x + ' ' + batch.length)
    await this.#cacheDB!.objects.bulkPut(batch)
    // const endTime = performance.now()
    // const duration = endTime - startTime
    //this.#logger('Saved batch ' + x + ' ' + batch.length + ' ' + duration / TIME_MS.second)
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

  async disposeAsync(): Promise<void> { 
    this.#cacheDB?.close()
    this.#cacheDB = undefined
    await this.#writeQueue?.disposeAsync()
    this.#writeQueue = undefined
  }
}
