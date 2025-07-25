/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { StringPropertyInfo } from './PropertyManager.js'
import { Dexie, DexieOptions, Table } from 'dexie'
import { isSafari } from '@speckle/shared'
import { CustomLogger } from '../types/functions.js'

const defaultModel = 'Xenova/all-MiniLM-L6-v2'
let status: string = 'Loading model...'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pipe: any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getPipeline = async (model: string): Promise<any> => {
  if (pipe) {
    return pipe
  }
  const { pipeline } = await import('@huggingface/transformers')
  pipe = await pipeline('feature-extraction', model, {
    progress_callback: (progressInfo: { status: string }) => {
      if (progressInfo.status !== status) {
        status = progressInfo.status
        console.log(`Loading model: ${progressInfo.status}`)
      }
    }
  })
  return pipe
}

export interface VectorEntry {
  id: number // Dexie requires an id field, but we will not use it
  baseId: string
  vector: number[]
}

export interface QueryResult {
  baseId: string
  similarity: number
}
// Cosine similarity function
const cosineSimilarity = (vecA: number[], vecB: number[]): number => {
  const dotProduct = vecA.reduce((sum, val, index) => sum + val * vecB[index], 0)
  const magnitudeA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0))
  const magnitudeB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magnitudeA * magnitudeB)
}
const getEmbeddingFromText = async (text: string): Promise<number[]> => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const pipe = await getPipeline(defaultModel)
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const output = await pipe(text, {
    pooling: 'mean',
    normalize: true
  })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return output.data as number[]
}

export class VectorStore extends Dexie {
  static #databaseName: string = 'speckle-vectors'
  vectors!: Table<VectorEntry, string> // Table type: <entity, primaryKey>

  constructor(options: DexieOptions) {
    super(VectorStore.#databaseName, options)

    this.version(1).stores({
      vectors: '++id' // baseId is primary key
    })
  }
}

export interface VectorManagerOptions {
  logger?: CustomLogger
  indexedDB?: IDBFactory
  keyRange?: {
    bound: Function
    lowerBound: Function
    upperBound: Function
  }
}

export class VectorManager {
  #options: VectorManagerOptions
  #logger: CustomLogger
  #vectorDb?: VectorStore

  constructor(options: VectorManagerOptions) {
    this.#options = options
    this.#logger = options.logger || ((): void => {})
  }

  async #openDatabase(): Promise<VectorStore> {
    const db = new VectorStore({
      indexedDB: this.#options.indexedDB ?? globalThis.indexedDB,
      IDBKeyRange: this.#options.keyRange ?? IDBKeyRange,
      chromeTransactionDurability: 'relaxed'
    })
    await db.open()
    return db
  }

  async #setupCacheDb(): Promise<void> {
    if (this.#vectorDb !== undefined) {
      return
    }

    // Initialize
    await this.#safariFix()
    this.#vectorDb = await this.#openDatabase()
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

  // Insert data by generating embeddings from text
  async insert(data: StringPropertyInfo): Promise<string> {
    await this.#setupCacheDb()
    const embeddings: VectorEntry[] = []
    for (const group of data.valueGroups) {
      const embedding = await getEmbeddingFromText(group.value)
      for (const id of group.ids) {
        embeddings.push({ baseId: id, vector: embedding } as VectorEntry)
      }
    }
    const k = await this.#vectorDb!.transaction(
      'rw',
      this.#vectorDb!.vectors,
      async () => {
        try {
          const key = await this.#vectorDb!.vectors.bulkPut(embeddings)
          return key
        } catch (error) {
          this.#logger(`Error inserting vectors: ${error}`)
          return ''
        }
      }
    )
    return k
  }

  // Query vectors by cosine similarity (using a text input that will be converted into embeddings)
  async query(queryText: string, limit = 10): Promise<QueryResult[]> {
    await this.#setupCacheDb()
    // Get embeddings for the query text
    const queryVector = await getEmbeddingFromText(queryText)
    const x = await this.#vectorDb!.transaction(
      'r',
      this.#vectorDb!.vectors,
      async () => {
        const vectors = await this.#vectorDb!.vectors.toArray() // Retrieve all vectors

        // Calculate cosine similarity for each vector and sort by similarity
        const similarities = vectors.map((entry) => {
          const similarity = cosineSimilarity(queryVector, entry.vector)
          return { baseId: entry.baseId, similarity } as QueryResult
        })

        similarities.sort((a, b) => b.similarity - a.similarity) // Sort by similarity (descending)
        return similarities.slice(0, limit) // Return the top N results based on limit
      }
    )
    return x
  }
}
