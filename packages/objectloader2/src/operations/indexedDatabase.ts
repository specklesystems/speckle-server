import BatchingQueue from '../helpers/batchingQueue.js'
import Queue from '../helpers/queue.js'
import { ObjectLoaderRuntimeError } from '../types/errors.js'
import { CustomLogger, Item, isBase } from '../types/types.js'
import { ensureError, isSafari } from '@speckle/shared'
import { BaseDatabaseOptions } from './options.js'
import { Cache } from './interfaces.js'
import { isString } from 'lodash'

export default class IndexedDatabase implements Cache {
  static #databaseName: string = 'speckle-cache'
  #options: BaseDatabaseOptions
  #logger: CustomLogger

  #cacheDB?: IDBDatabase

  #writeQueue: BatchingQueue<Item> | undefined

  constructor(options: BaseDatabaseOptions) {
    this.#options = {
      ...{
        indexedDB: globalThis.indexedDB,
        maxCacheReadSize: 5000,
        maxCacheBatchWriteWait: 1000,
        enableCaching: true
      },
      ...options
    }
    this.#logger = options.logger || (() => {})
  }

  async write(params: { item: Item }): Promise<void> {
    const { item } = params
    if (!this.#writeQueue) {
      await this.#setupCacheDb()
      this.#writeQueue = new BatchingQueue<Item>({
        batchSize: this.#options.maxCacheWriteSize ?? 10000,
        maxWaitTime: this.#options.maxCacheBatchWriteWait,
        processFunction: (batch: Item[]) =>
          this.#cacheSaveBatch({ batch, cacheDB: this.#cacheDB! })
      })
    }
    this.#writeQueue.add(item)
  }

  async finish(): Promise<void> {
    await this.#writeQueue?.finish()
  }

  #openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = this.#options.indexedDB?.open(IndexedDatabase.#databaseName, 1)
      if (!request) {
        throw new Error('No indexedDb')
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.#options.streamId)) {
          db.createObjectStore(this.#options.streamId)
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = (e) =>
        reject(ensureError(e, 'Failed to open IndexedDB database'))
    })
  }

  #supportsCache(): boolean {
    return !!(this.#options.enableCaching && this.#options.indexedDB)
  }

  async #setupCacheDb(): Promise<void> {
    if (this.#cacheDB !== undefined && !this.#supportsCache()) {
      throw new Error(
        "Browser hasn't initialized a database.  It may not be supported."
      )
    }

    // Initialize
    await this.#safariFix()
    this.#cacheDB = await this.#openDatabase()
  }

  #checkCache(params: {
    store: IDBObjectStore
    batch: string[]
  }): Promise<Item | string>[] {
    const { store, batch } = params
    return batch.map<Promise<Item | string>>(async (baseId) => {
      const getBase = new Promise((resolve, reject) => {
        const request = store.get(baseId)

        request.onsuccess = () => resolve(request.result)
        request.onerror = () =>
          reject(ensureError(request.error, 'Error trying to get a batch'))
      })
      const base = await getBase
      if (base === undefined) {
        return baseId
      } else {
        if (isBase(base)) {
          return { baseId, base }
        } else {
          throw new ObjectLoaderRuntimeError(`${baseId} is not a base`)
        }
      }
    })
  }

  async processItems(params: {
    ids: string[]
    foundItems: Queue<Item>
    notFoundItems: Queue<string>
  }): Promise<void> {
    const { ids, foundItems, notFoundItems } = params
    await this.#setupCacheDb()

    const maxCacheReadSize = this.#options.maxCacheReadSize ?? 5000
    for (let i = 0; i < ids.length; i += maxCacheReadSize) {
      const batch = ids.slice(i, i + maxCacheReadSize)
      const store = this.#cacheDB!.transaction(this.#options.streamId, 'readonly', {
        durability: 'relaxed'
      }).objectStore(this.#options.streamId)
      const idbChildrenPromises = this.#checkCache({ store, batch })
      const cachedData = await Promise.all(idbChildrenPromises)
      for (const cachedObj of cachedData) {
        if (isString(cachedObj)) {
          notFoundItems.add(cachedObj)
        } else {
          foundItems.add(cachedObj)
        }
      }

      this.#logger('Read ' + batch.length)
    }
  }

  async getItem(params: { id: string }): Promise<Item | undefined> {
    const { id } = params
    await this.#setupCacheDb()

    const store = this.#cacheDB!.transaction(
      this.#options.streamId,
      'readonly'
    ).objectStore(this.#options.streamId)
    const getBase = new Promise<unknown>((resolve, reject) => {
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () =>
        reject(ensureError(request.error, 'Error trying to get an item'))
    })
    const base = await getBase
    if (base === undefined) return undefined
    if (isBase(base)) {
      return { baseId: id, base }
    } else {
      throw new ObjectLoaderRuntimeError(`${id} is not a base`)
    }
  }

  async #cacheSaveBatch(params: {
    batch: Item[]
    cacheDB: IDBDatabase
  }): Promise<void> {
    const { batch, cacheDB } = params
    const transaction = cacheDB.transaction(this.#options.streamId, 'readwrite', {
      durability: 'relaxed'
    })
    const store = transaction.objectStore(this.#options.streamId)
    const promises: Promise<void>[] = []
    for (let index = 0; index < batch.length; index++) {
      const element = batch[index]
      const putItem = new Promise<void>((resolve, reject) => {
        const request = store.put(element.base, element.baseId)
        request.onsuccess = () => resolve()
        request.onerror = () =>
          reject(ensureError(request.error, 'Error trying to save a batch'))
      })
      promises.push(putItem)
    }
    await Promise.all(promises)
    transaction.commit()
    this.#logger('Saved ' + batch.length)
    await this.#promisifyIDBTransaction(transaction)
  }
  #promisifyIDBTransaction(request: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
      request.oncomplete = () => resolve()
      request.onerror = (e) =>
        reject(ensureError(e, 'Failed to open Transaction for database'))
    })
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
