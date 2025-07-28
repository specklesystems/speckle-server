/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
/* eslint-disable @typescript-eslint/no-explicit-any */

export interface VectorEntry {
  id: number
  baseId: string
  vector: number[]
  prop: string
}

export class VectorStore {
  #db: IDBDatabase | undefined = undefined
  readonly #dbName: string
  readonly #storeName: string

  constructor(dbName: string, storeName: string) {
    this.#dbName = dbName
    this.#storeName = storeName
  }

  /**
   * Initializes the database connection and creates the object store if needed.
   * This must be called before any other database operations.
   */
  async init(): Promise<void> {
    if (this.#db) return
    return this.#openDatabase()
  }

  /**
   * Opens the database, and if there's an error, deletes the database and tries again.
   */
  async #openDatabase(): Promise<void> {
    const idb = indexedDB

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
        db.createObjectStore(this.#storeName, { keyPath: 'id', autoIncrement: true })
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
   * Inserts or updates an array of items in a single transaction.
   * @param data The array of items to insert.
   */
  bulkInsert(data: VectorEntry[]): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.#getDB().transaction(this.#storeName, 'readwrite', {
          durability: 'relaxed'
        })
        const store = transaction.objectStore(this.#storeName)

        transaction.onerror = (): any => {
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
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
  bulkGet(ids: string[]): Promise<(VectorEntry | undefined)[]> {
    return new Promise((resolve, reject) => {
      if (ids.length === 0) {
        return resolve([])
      }
      try {
        const transaction = this.#getDB().transaction(this.#storeName, 'readonly', {
          durability: 'relaxed'
        })
        const store = transaction.objectStore(this.#storeName)
        const promises: Promise<VectorEntry | undefined>[] = []

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

  /**
   * Retrieves all items from the object store.
   */
  getAll(): Promise<VectorEntry[]> {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.#getDB().transaction(this.#storeName, 'readonly')
        const store = transaction.objectStore(this.#storeName)
        const request = store.getAll()

        request.onerror = (): any => reject(`Request error: ${request.error}`)
        request.onsuccess = (): any => resolve(request.result)
      } catch (error) {
        reject(error)
      }
    })
  }

  close(): void {
    if (!this.#db) return
    this.#db.close()
    this.#db = undefined
  }
}
