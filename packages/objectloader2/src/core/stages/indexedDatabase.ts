/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { isSafari } from '@speckle/shared'
import { Item } from '../../types/types.js'
import { Database } from '../interfaces.js'

/**
 * A wrapper class for IndexedDB to simplify common database operations.
 */
export interface IndexedDatabaseOptions {
  indexedDB?: IDBFactory
  keyRange?: {
    bound: Function
    lowerBound: Function
    upperBound: Function
  }
}
export class IndexedDatabase implements Database {
  #options: IndexedDatabaseOptions

  #db: IDBDatabase | undefined = undefined
  readonly #dbName: string = 'speckle-cache'
  readonly #storeName: string = 'cache'

  constructor(options: IndexedDatabaseOptions) {
    this.#options = options
  }

  /**
   * Initializes the database connection and creates the object store if needed.
   * This must be called before any other database operations.
   */
  async init(): Promise<void> {
    if (this.#db) return
    await this.#safariFix()
    return this.#openDatabase()
  }

  /**
   * Opens the database, and if there's an error, deletes the database and tries again.
   */
  async #openDatabase(): Promise<void> {
    const idb = this.#options.indexedDB ?? indexedDB

    return new Promise((resolve, reject) => {
      const request = idb.open(this.#dbName, 1)

      request.onerror = (): any => {
        console.warn(
          `Failed to open database: ${this.#dbName}, deleting and trying again`
        )
        // Delete the database and try again
        const deleteRequest = idb.deleteDatabase(this.#dbName)
        deleteRequest.onsuccess = (): any => {
          // Try opening again after deletion
          void this.#openDatabase().then(resolve).catch(reject)
        }
        deleteRequest.onerror = (): any => {
          reject(`Failed to delete and reopen database: ${this.#dbName}`)
        }
      }

      request.onupgradeneeded = (event): any => {
        const db = (event.target as IDBOpenDBRequest).result
        if (db.objectStoreNames.contains(this.#storeName)) {
          db.deleteObjectStore(this.#storeName)
        }
        db.createObjectStore(this.#storeName, { keyPath: 'baseId' })
      }

      request.onsuccess = (event): any => {
        this.#db = (event.target as IDBOpenDBRequest).result
        resolve()
      }
    })
  }

  #getDB(): IDBDatabase {
    if (!this.#db) {
      throw new Error('Database not initialized. Call init() first.')
    }
    return this.#db
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
  async putAll(data: Item[]): Promise<void> {
    await this.init() // Ensure the database is initialized
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.#getDB().transaction(this.#storeName, 'readwrite', {
          durability: 'relaxed'
        })
        const store = transaction.objectStore(this.#storeName)

        transaction.onerror = (): any => {
          reject(`Transaction error: ${transaction.error}`)
        }
        transaction.oncomplete = (): any => {
          resolve()
        }

        data.forEach((item) => store.put(item))
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Retrieves an array of items from the object store based on their IDs.
   * @param ids The array of IDs to retrieve.
   */
  async getAll(ids: string[]): Promise<(Item | undefined)[]> {
    await this.init() // Ensure the database is initialized
    return new Promise((resolve, reject) => {
      if (ids.length === 0) {
        return resolve([])
      }
      try {
        const transaction = this.#getDB().transaction(this.#storeName, 'readonly', {
          durability: 'relaxed'
        })
        const store = transaction.objectStore(this.#storeName)
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
            resolve(results)
          })
          .catch(reject)
      } catch (error) {
        reject(error)
      }
    })
  }
  dispose(): void {
    if (!this.#db) return
    this.#db.close()
    this.#db = undefined
  }
}
