import BatchingQueue from '../helpers/batchingQueue.js'
import Queue from '../helpers/queue.js'
import {
  Base,
  CustomLogger,
  Item,
  BaseDatabaseOptions,
  asBase
} from '../types/types.js'
import { ensureError, isSafari } from '@speckle/shared'

export default class CacheDatabase {
  private static _databaseName: string = 'speckle-cache'
  private static _storeName: string = 'objects'
  private _options: BaseDatabaseOptions
  private _logger: CustomLogger

  private _cacheDB?: IDBDatabase

  private _writeQueue: BatchingQueue<Item>

  constructor(logger: CustomLogger, options?: BaseDatabaseOptions) {
    this._logger = logger
    this._options = options || new BaseDatabaseOptions()
    this._writeQueue = new BatchingQueue<Item>(
      'save cache',
      500,
      1000,
      (batch: Item[]) => CacheDatabase.cacheSaveBatch(batch, this._cacheDB!)
    )
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

  async cacheStoreObjects(objects: Item[]): Promise<void> {
    if (!(await this.setupCacheDb())) {
      return
    }
    try {
      const store = this._cacheDB!.transaction(
        CacheDatabase._storeName,
        'readwrite'
      ).objectStore(CacheDatabase._storeName)
      for (const obj of objects) {
        store.put(obj.obj, obj.id)
      }
      return CacheDatabase.promisifyIDBTransaction(store.transaction)
    } catch (e) {
      this._logger(e instanceof Error ? e.message : String(e))
    }
    return Promise.resolve()
  }

  async cacheGetObjects(
    ids: string[],
    found: Queue<Item>,
    notFound: Queue<string>
  ): Promise<void> {
    if (!(await this.setupCacheDb())) {
      return
    }

    let count = 0
    for (let i = 0; i < ids.length; i += 500) {
      const idsChunk = ids.slice(i, i + 500)

      const store = this._cacheDB!.transaction(
        CacheDatabase._storeName,
        'readonly'
      ).objectStore(CacheDatabase._storeName)
      const idbChildrenPromises = idsChunk.map<Promise<void>>(async (id) => {
        var getItem = new Promise((resolve, reject) => {
          const request = store.get(id)

          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error)
        })
        const base = await getItem
        count++
        if (base === undefined) {
          await notFound.add(id)
          this._logger(`Object ${count} not found in cache`)
        } else {
          this._logger(`Object ${count} found in cache`)
          await found.add({ id, obj: asBase(base) })
        }
      })
      await Promise.all(idbChildrenPromises)
    }
  }

  async cacheGetObject(id: string): Promise<Item | undefined> {
    if (!(await this.setupCacheDb())) {
      return undefined
    }

    const store = this._cacheDB!.transaction(
      CacheDatabase._storeName,
      'readonly'
    ).objectStore(CacheDatabase._storeName)
    var getItem = new Promise<unknown>((resolve, reject) => {
      const request = store.get(id)

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const b = await getItem
    if (b === undefined) return undefined
    return { id, obj: asBase(b) }
  }

  async write(obj: Item): Promise<void> {
    await this._writeQueue.add(obj)
  }

  static async cacheSaveBatch(batch: Item[], cacheDB: IDBDatabase): Promise<void> {
    console.log('Saving batch to cache: ' + batch.length)
    const transaction = cacheDB.transaction(CacheDatabase._storeName, 'readwrite')
    const store = transaction.objectStore(CacheDatabase._storeName)
    const promises: Promise<void>[] = []
    for (let index = 0; index < batch.length; index++) {
      const element = batch[index]
      var putItem = new Promise<void>((resolve, reject) => {
        const request = store.put(element, element.id)
        request.onsuccess = () => resolve()
        request.onerror = () => reject(request.error)
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
