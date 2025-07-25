/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { isSafari } from '@speckle/shared'
import { CustomLogger } from '../../types/functions.js'
import { Item } from '../../types/types.js'

/**
 * A wrapper class for IndexedDB to simplify common database operations.
 */
export interface ItemStoreOptions {
  indexedDB?: IDBFactory
  keyRange?: {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    bound: Function
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    lowerBound: Function
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    upperBound: Function
  }
}
export class ItemStore {
  #options: ItemStoreOptions

  private logger: CustomLogger
  private db: IDBDatabase | null = null
  private readonly dbName: string
  private readonly storeName: string

  constructor(options: ItemStoreOptions, logger: CustomLogger, dbName: string, storeName: string) {
    this.#options = options
    this.logger = logger
    this.dbName = dbName
    this.storeName = storeName
  }

  /**
   * Initializes the database connection and creates the object store if needed.
   * This must be called before any other database operations.
   */
  public init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = (this.#options.indexedDB ?? indexedDB).open(this.dbName, 1)

      request.onerror = (): any => {
        this.logger(`Database error: ${request.error}`)
        reject(`Failed to open database: ${this.dbName}`)
      }

      request.onupgradeneeded = (event): any => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'baseId' })
        }
      }

      request.onsuccess = (event): any => {
        this.db = (event.target as IDBOpenDBRequest).result
        resolve()
      }
    })
  }

  private getDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.')
    }
    return this.db
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
      const tryIdb = (): Promise<IDBDatabaseInfo[]> | undefined =>
        this.#options.indexedDB?.databases().finally(resolve)
      intervalId = setInterval(() => {
        void tryIdb()
      }, 100)
      void tryIdb()
    }).finally(() => clearInterval(intervalId))
  }

  /**
   * Inserts or updates an array of items in a single transaction.
   * @param data The array of items to insert.
   */
  public bulkInsert(data: Item[]): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.getDB().transaction(this.storeName, 'readwrite', {
          durability: 'strict'
        })
        const store = transaction.objectStore(this.storeName)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        transaction.onerror = (): any => {
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors, @typescript-eslint/no-base-to-string
          reject(`Transaction error: ${transaction.error}`)
        }
        transaction.oncomplete = (): any => {
          resolve()
        }

        data.forEach((item) => store.put(item))
      } catch (error) {
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        reject(error)
      }
    })
  }

  /**
   * Retrieves an array of items from the object store based on their IDs.
   * @param ids The array of IDs to retrieve.
   */
  public bulkGet(ids: string[]): Promise<Item[]> {
    return new Promise((resolve, reject) => {
      if (ids.length === 0) {
        return resolve([])
      }
      try {
        const transaction = this.getDB().transaction(this.storeName, 'readonly', {
          durability: 'relaxed'
        })
        const store = transaction.objectStore(this.storeName)
        const promises: Promise<Item | undefined>[] = []

        for (const id of ids) {
          promises.push(
            new Promise((resolveGet, rejectGet) => {
              const request = store.get(id)
              request.onerror = (): void =>
                rejectGet(`Request error for id ${id}: ${request.error}`)
              // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
              request.onsuccess = (): void => resolveGet(request.result)
            })
          )
        }

        Promise.all(promises)
          .then((results) => {
            // Filter out any undefined results for keys that were not found
            resolve(results.filter((item): item is Item => item !== undefined))
          })
          .catch(reject)
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Retrieves all items from the object store.
   */
  public getAll(): Promise<Item[]> {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.getDB().transaction(this.storeName, 'readonly')
        const store = transaction.objectStore(this.storeName)
        const request = store.getAll()

        request.onerror = (): any => reject(`Request error: ${request.error}`)
        request.onsuccess = (): any => resolve(request.result)
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Clears all items from the object store.
   */
  public clear(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.getDB().transaction(this.storeName, 'readwrite')
        const store = transaction.objectStore(this.storeName)
        const request = store.clear()

        request.onerror = (): any => reject(`Request error: ${request.error}`)
        request.onsuccess = (): any => resolve()
      } catch (error) {
        reject(error)
      }
    })
  }
}
