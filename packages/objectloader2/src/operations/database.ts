import { ObjectLoaderRuntimeError } from '../types/errors.js'
import {
  Base,
  CustomLogger,
  isString,
  Item,
  BaseDatabaseOptions,
  isBase
} from '../types/types.js'
import { isSafari } from '@speckle/shared'

type ReadBatchFuture = {
  key: string
  resolve: (obj: Base) => void
  error: (reason?: unknown) => void
}

type WriteBatchFuture = {
  obj: Base
  resolve: () => void
  error: (reason?: unknown) => void
}

export default class CacheDatabase {
  private static _databaseName: string = 'speckle-object-cache'
  private static _storeName: string = 'objects'
  private _options: BaseDatabaseOptions
  private _logger: CustomLogger

  private _cacheDB?: IDBDatabase
  private _readQueue: ReadBatchFuture[] = []
  private _activeReaders = 0
  private _readerPoolSize = 5

  private _writeQueue: WriteBatchFuture[] = []
  private _activeWriters = 0
  private _writerPoolSize = 5

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
          db.createObjectStore(storeName)
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
      return this.promisifyIDBTransaction(store.transaction)
    } catch (e) {
      this._logger(e instanceof Error ? e.message : String(e))
    }
    return Promise.resolve()
  }

  async cacheGetObjects(ids: string[]): Promise<Record<string, Base> | null> {
    if (!(await this.setupCacheDb())) {
      return null
    }

    const ret: Record<string, Base> = {}

    for (let i = 0; i < ids.length; i += 500) {
      const idsChunk = ids.slice(i, i + 500)

      const store = this._cacheDB!.transaction(
        CacheDatabase._storeName,
        'readonly'
      ).objectStore(CacheDatabase._storeName)
      const idbChildrenPromises = idsChunk.map<Promise<Item>>((id) =>
        this.promisifyIdbRequest(store.get(id)).then(
          (obj: Base) => ({ id, obj } as Item)
        )
      )
      const cachedData = await Promise.all(idbChildrenPromises)

      for (const cachedObj of cachedData) {
        if (
          !cachedObj.obj ||
          (isString(cachedObj.obj) &&
            (cachedObj.obj as unknown as string).startsWith('<html'))
        ) {
          continue
        }
        ret[cachedObj.id] = cachedObj.obj
      }
    }

    return ret
  }

  async readCache(key: string): Promise<Base> {
    return new Promise<Base>((resolve, error) => {
      this._readQueue.push({ key, resolve, error })
      this.processReadQueue()
    })
  }

  private processReadQueue() {
    if (this._activeReaders >= this._readerPoolSize || this._readQueue.length === 0)
      return

    this._activeReaders++
    const future = this._readQueue.shift()
    if (future === undefined) return

    const transaction = this._cacheDB!.transaction(CacheDatabase._storeName, 'readonly')
    const store = transaction.objectStore(CacheDatabase._storeName)
    const request = store.get(future.key)
    request.onsuccess = () => {
      this._activeReaders--
      if (isBase(request.result)) {
        throw new ObjectLoaderRuntimeError('json is not a base')
      }
      future.resolve(request.result as Base)
      this.processReadQueue() // Process the next request
    }

    request.onerror = () => {
      console.error('IndexedDB Read Error:', request.error)
      this._activeReaders--
      future.error(null)
      this.processReadQueue()
    }
  }

  async write(obj: Base): Promise<void> {
    return new Promise<void>((resolve, error) => {
      this._writeQueue.push({ obj, resolve, error })
      this.processWriteQueue()
    })
  }

  private processWriteQueue() {
    if (this._activeWriters >= this._writerPoolSize || this._writeQueue.length === 0)
      return

    this._activeWriters++
    const future = this._writeQueue.shift()
    if (future === undefined) return

    const transaction = this._cacheDB!.transaction(
      CacheDatabase._storeName,
      'readwrite'
    )
    const store = transaction.objectStore(CacheDatabase._storeName)
    store.put(future.obj)

    transaction.oncomplete = () => {
      this._activeWriters--
      future.resolve()
      this.processWriteQueue()
    }

    transaction.onerror = () => {
      console.error('IndexedDB Write Error:', transaction.error)
      this._activeWriters--
      future.error()
      this.processWriteQueue()
    }
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
