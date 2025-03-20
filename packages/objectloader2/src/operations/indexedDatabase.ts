import BatchingQueue from '../helpers/batchingQueue.js'
import Queue from '../helpers/queue.js'
import { ObjectLoaderRuntimeError } from '../types/errors.js'
import { Item, isBase } from '../types/types.js'
import { ensureError, isSafari } from '@speckle/shared'
import { BaseDatabaseOptions } from './options.js'
import { Cache } from './interfaces.js'
import { isString } from 'lodash'

export default class IndexedDatabase implements Cache {
  static #databaseName: string = 'speckle-cache'
  static #storeName: string = 'objects'
  #options: BaseDatabaseOptions

  #cacheDB?: IDBDatabase

  #writeQueue: BatchingQueue<Item> | undefined

  constructor(options: Partial<BaseDatabaseOptions>) {
    this.#options = {
      ...{
        logger: () => {},
        indexedDB: globalThis.indexedDB,
        maxCacheReadSize: 5000,
        maxCacheWriteSize: 10000,
        maxCacheBatchWriteWait: 1000,
        enableCaching: true
      },
      ...options
    }
  }

  async write(obj: Item): Promise<void> {
    if (!this.#writeQueue) {
      await this.#setupCacheDb()
      this.#writeQueue = new BatchingQueue<Item>(
        this.#options.maxCacheWriteSize,
        (batch: Item[]) => this.#cacheSaveBatch(batch, this.#cacheDB!)
      )
    }
    this.#writeQueue.add(obj)
  }

  async finish(): Promise<void> {
    await this.#writeQueue?.finish()
  }

  #openDatabase(dbName: string, storeName: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = this.#options.indexedDB.open(dbName, 1)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName)
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
    this.#cacheDB = await this.#openDatabase(
      IndexedDatabase.#databaseName,
      IndexedDatabase.#storeName
    )
  }

  #checkCache(store: IDBObjectStore, batch: string[]): Promise<Item | string>[] {
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

  async processItems(
    baseIds: string[],
    found: Queue<Item>,
    notFound: Queue<string>
  ): Promise<void> {
    await this.#setupCacheDb()

    for (let i = 0; i < baseIds.length; i += this.#options.maxCacheReadSize) {
      const baseIdsChunk = baseIds.slice(i, i + this.#options.maxCacheReadSize)
      const store = this.#cacheDB!.transaction(IndexedDatabase.#storeName, 'readonly', {
        durability: 'relaxed'
      }).objectStore(IndexedDatabase.#storeName)
      const idbChildrenPromises = this.#checkCache(store, baseIdsChunk)
      const cachedData = await Promise.all(idbChildrenPromises)
      for (const cachedObj of cachedData) {
        if (isString(cachedObj)) {
          notFound.add(cachedObj)
        } else {
          found.add(cachedObj)
        }
      }

      this.#options.logger('Read ' + baseIdsChunk.length)
    }
  }

  async getItem(baseId: string): Promise<Item | undefined> {
    await this.#setupCacheDb()

    const store = this.#cacheDB!.transaction(
      IndexedDatabase.#storeName,
      'readonly'
    ).objectStore(IndexedDatabase.#storeName)
    const getBase = new Promise<unknown>((resolve, reject) => {
      const request = store.get(baseId)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () =>
        reject(ensureError(request.error, 'Error trying to get an item'))
    })
    const base = await getBase
    if (base === undefined) return undefined
    if (isBase(base)) {
      return { baseId, base }
    } else {
      throw new ObjectLoaderRuntimeError(`${baseId} is not a base`)
    }
  }

  async #cacheSaveBatch(batch: Item[], cacheDB: IDBDatabase): Promise<void> {
    const transaction = cacheDB.transaction(IndexedDatabase.#storeName, 'readwrite', {
      durability: 'relaxed'
    })
    const store = transaction.objectStore(IndexedDatabase.#storeName)
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
    this.#options.logger('Saved ' + batch.length)
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
    if (!isSafari() || !this.#options.indexedDB.databases) return Promise.resolve()

    let intervalId: ReturnType<typeof setInterval>

    return new Promise<void>((resolve: () => void) => {
      const tryIdb = () => this.#options.indexedDB.databases().finally(resolve)
      intervalId = setInterval(() => {
        void tryIdb()
      }, 100)
      void tryIdb()
    }).finally(() => clearInterval(intervalId))
  }
}
