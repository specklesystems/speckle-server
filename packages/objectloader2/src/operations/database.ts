import BatchingQueue from '../helpers/batchingQueue.js'
import Queue from '../helpers/queue.js'
import { ObjectLoaderRuntimeError } from '../types/errors.js'
import { CustomLogger, Item, BaseDatabaseOptions, isBase } from '../types/types.js'
import { ensureError, isSafari } from '@speckle/shared'

export default class CacheDatabase {
  private static _databaseName: string = 'speckle-cache'
  private static _storeName: string = 'objects'
  private _options: BaseDatabaseOptions
  private _logger: CustomLogger

  private _cacheDB?: IDBDatabase

  private _writeQueue: BatchingQueue<Item> | undefined

  constructor(logger: CustomLogger, options?: Partial<BaseDatabaseOptions>) {
    this._logger = logger
    this._options = {
      ...{ batchMaxSize: 500, batchMaxWait: 1000, enableCaching: true },
      ...options
    }
  }

  async write(obj: Item): Promise<void> {
    if (!this._writeQueue) {
      if (!(await this.setupCacheDb())) {
        return
      }
      this._writeQueue = new BatchingQueue<Item>(
        this._options.batchMaxSize,
        this._options.batchMaxWait,
        (batch: Item[]) => CacheDatabase.cacheSaveBatch(batch, this._cacheDB!)
      )
    }
    this._writeQueue.add(obj)
  }

  async finish(): Promise<void> {
    await this._writeQueue?.finish()
  }

  private openDatabase(dbName: string, storeName: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1)

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

  private supportsCache(): boolean {
    return !!(this._options.enableCaching && globalThis.indexedDB)
  }

  private async setupCacheDb(): Promise<boolean> {
    if (this._cacheDB !== undefined && !this.supportsCache()) return false

    // Initialize
    await this.safariFix()
    this._cacheDB = await this.openDatabase(
      CacheDatabase._databaseName,
      CacheDatabase._storeName
    )
    return true
  }

  async setItems(items: Item[]): Promise<void> {
    if (!(await this.setupCacheDb())) {
      return
    }
    try {
      const store = this._cacheDB!.transaction(
        CacheDatabase._storeName,
        'readwrite'
      ).objectStore(CacheDatabase._storeName)
      for (const item of items) {
        store.put(item.base, item.baseId)
      }
      return CacheDatabase.promisifyIDBTransaction(store.transaction)
    } catch (e) {
      this._logger(e instanceof Error ? e.message : String(e))
    }
    return Promise.resolve()
  }

  async getItems(
    baseIds: string[],
    found: Queue<Item>,
    notFound: Queue<string>
  ): Promise<void> {
    if (!(await this.setupCacheDb())) {
      return
    }

    let count = 0
    for (let i = 0; i < baseIds.length; i += 500) {
      const baseIdsChunk = baseIds.slice(i, i + 500)

      const store = this._cacheDB!.transaction(
        CacheDatabase._storeName,
        'readonly'
      ).objectStore(CacheDatabase._storeName)
      const idbChildrenPromises = baseIdsChunk.map<Promise<void>>(async (baseId) => {
        const getBase = new Promise((resolve, reject) => {
          const request = store.get(baseId)

          request.onsuccess = () => resolve(request.result)
          request.onerror = () =>
            reject(ensureError(request.error, 'Error trying to get a batch'))
        })
        const base = await getBase
        count++
        if (base === undefined) {
          notFound.add(baseId)
          if (count % 1000 === 0) {
            this._logger(`Object ${count} not found in cache`)
          }
        } else {
          if (count % 1000 === 0) {
            this._logger(`Object ${count} found in cache`)
          }
          if (isBase(base)) {
            found.add({ baseId, base })
          } else {
            throw new ObjectLoaderRuntimeError(`${baseId} is not a base`)
          }
        }
      })
      await Promise.all(idbChildrenPromises)
    }
  }

  async getItem(baseId: string): Promise<Item | undefined> {
    if (!(await this.setupCacheDb())) {
      return undefined
    }

    const store = this._cacheDB!.transaction(
      CacheDatabase._storeName,
      'readonly'
    ).objectStore(CacheDatabase._storeName)
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

  static async cacheSaveBatch(batch: Item[], cacheDB: IDBDatabase): Promise<void> {
    const transaction = cacheDB.transaction(CacheDatabase._storeName, 'readwrite')
    const store = transaction.objectStore(CacheDatabase._storeName)
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
    await CacheDatabase.promisifyIDBTransaction(transaction)
  }
  private static promisifyIDBTransaction(request: IDBTransaction): Promise<void> {
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
  private async safariFix(): Promise<void> {
    // No point putting other browsers or older versions of Safari through this mess.
    if (!isSafari() || !indexedDB.databases) return Promise.resolve()

    let intervalId: ReturnType<typeof setInterval>

    return new Promise<void>((resolve: () => void) => {
      const tryIdb = () => indexedDB.databases().finally(resolve)
      intervalId = setInterval(() => {
        void tryIdb()
      }, 100)
      void tryIdb()
    }).finally(() => clearInterval(intervalId))
  }
}
