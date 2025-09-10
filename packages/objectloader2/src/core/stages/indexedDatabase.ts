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
  /**
   * Chunk size for batch operations to avoid memory pressure.
   * Defaults to 500. Lower values use less memory but may be slower.
   */
  chunkSize?: number
}
export class IndexedDatabase implements Database {
  #options: IndexedDatabaseOptions
  #chunkSize: number

  #db: IDBDatabase | undefined = undefined
  readonly #dbName: string = 'speckle-cache'
  readonly #storeName: string = 'cache'

  constructor(options: IndexedDatabaseOptions) {
    this.#options = options
    this.#chunkSize = options.chunkSize ?? 500
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
   * Uses chunking to avoid memory pressure from creating too many promises at once.
   * @param ids The array of IDs to retrieve.
   */
  async getAll(ids: string[]): Promise<(Item | undefined)[]> {
    await this.init() // Ensure the database is initialized

    if (ids.length === 0) {
      return []
    }

    // Use chunking to process IDs in smaller batches to reduce memory pressure
    const results: (Item | undefined)[] = new Array<Item | undefined>(ids.length)

    for (let i = 0; i < ids.length; i += this.#chunkSize) {
      const chunk = ids.slice(i, i + this.#chunkSize)
      const chunkResults = await this.#getChunk(chunk)

      // Place results in the correct positions
      for (let j = 0; j < chunkResults.length; j++) {
        results[i + j] = chunkResults[j]
      }
    }

    return results
  }

  /**
   * Retrieves a chunk of items from the object store.
   * @param ids The array of IDs to retrieve (should be <= chunkSize).
   */
  async #getChunk(ids: string[]): Promise<(Item | undefined)[]> {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.#getDB().transaction(this.#storeName, 'readonly', {
          durability: 'relaxed'
        })
        const store = transaction.objectStore(this.#storeName)
        const results: (Item | undefined)[] = new Array<Item | undefined>(ids.length)
        let completedRequests = 0

        transaction.onerror = (): void => {
          reject(`Transaction error: ${transaction.error}`)
        }

        // Process each ID in the chunk
        for (let i = 0; i < ids.length; i++) {
          const request = store.get(ids[i])
          const index = i // Capture the index for the closure

          request.onerror = (): void => {
            reject(`Request error for id ${ids[index]}: ${request.error}`)
          }

          request.onsuccess = (): void => {
            results[index] = request.result as Item | undefined
            completedRequests++

            // When all requests in this chunk are complete, resolve
            if (completedRequests === ids.length) {
              resolve(results)
            }
          }
        }
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
