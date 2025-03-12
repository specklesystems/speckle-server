import { Base, CustomLogger, isString, Item, BaseDatabaseOptions } from './types.js'
import { isSafari } from '@speckle/shared'

export default class BaseDatabase {
  private static _databaseName: string = 'speckle-object-cache'
  private static _storeName: string = 'objects'
  private _options: BaseDatabaseOptions
  private _logger: CustomLogger

  private _cacheDB?: IDBDatabase

  constructor(logger: CustomLogger, options?: BaseDatabaseOptions) {
    this._logger = logger
    this._options = options || new BaseDatabaseOptions()
  }

  private openDatabase(dbName: string, storeName: string): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true })
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () =>
        reject(
          request.error instanceof Error
            ? request.error
            : new Error(String(request.error))
        )
    })
  }

  private supportsCache(): boolean {
    return !!(this._options.enableCaching && globalThis.indexedDB)
  }

  private async setupCacheDb(): Promise<void> {
    if (!this.supportsCache() || this._cacheDB !== null) return

    // Initialize
    await this.safariFix()
    this._cacheDB = await this.openDatabase(
      BaseDatabase._databaseName,
      BaseDatabase._storeName
    )
  }

  async cacheStoreObjects(objects: Item[]): Promise<void> {
    if (!this.supportsCache()) {
      return
    }

    if (this._cacheDB === null) {
      await this.setupCacheDb()
    }

    try {
      const store = this._cacheDB!.transaction(
        BaseDatabase._storeName,
        'readwrite'
      ).objectStore(BaseDatabase._storeName)
      for (const obj of objects) {
        store.put(obj.obj, obj.id)
      }
      return this.promisifyIDBTransaction(store.transaction)
    } catch (e) {
      this._logger(e instanceof Error ? e.message : String(e))
    }
    return Promise.resolve()
  }

  async cacheGetObjects(ids: string[]): Promise<Record<string, Base>> {
    if (!this.supportsCache()) {
      return {}
    }

    if (this._cacheDB === null) {
      await this.setupCacheDb()
    }

    const ret: Record<string, Base> = {}

    for (let i = 0; i < ids.length; i += 500) {
      const idsChunk = ids.slice(i, i + 500)

      const store = this._cacheDB!.transaction(
        BaseDatabase._storeName,
        'readonly'
      ).objectStore(BaseDatabase._storeName)
      const idbChildrenPromises = idsChunk.map<Promise<Item>>((id) =>
        this.promisifyIdbRequest(store.get(id)).then(
          (obj: Base) => ({ id, obj } as Item)
        )
      )
      const cachedData = await Promise.all(idbChildrenPromises)

      // this.logger("Cache check for : ", idsChunk.length, Date.now() - t0)
      for (const cachedObj of cachedData) {
        if (
          !cachedObj.obj ||
          (isString(cachedObj.obj) && (cachedObj.obj as string).startsWith('<html'))
        ) {
          // non-existent/invalid objects are retrieved with `undefined` data
          continue
        }
        ret[cachedObj.id] = cachedObj.obj
      }
    }

    return ret
  }
  private promisifyIDBTransaction(request: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
      request.oncomplete = () => resolve()
      request.onerror = () =>
        reject(
          request.error instanceof Error
            ? request.error
            : new Error(String(request.error))
        )
    })
  }

  private promisifyIdbRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result)
      request.onerror = () =>
        reject(
          request.error instanceof Error
            ? request.error
            : new Error(String(request.error))
        )
    })
  }

  /**
   * Fixes a Safari bug where IndexedDB requests get lost and never resolve - invoke before you use IndexedDB
   * @link Credits and more info: https://github.com/jakearchibald/safari-14-idb-fix
   */
  async safariFix(): Promise<void> {
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
