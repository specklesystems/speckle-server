/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { StringPropertyInfo } from './PropertyManager.js'
import { CustomLogger } from '../types/functions.js'
import { VectorEntry, VectorStore } from './VectorStore.js'

const defaultModel = 'Xenova/all-MiniLM-L6-v2'
let status: string = 'Loading model...'

let pipe: any

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
  #vectorDb?: VectorStore

  #count = 0
  constructor(options: VectorManagerOptions) {
    this.#options = options
  }

  async #openDatabase(): Promise<VectorStore> {
    const db = new VectorStore('speckle-vectors', 'vectors')
    await db.init()
    return db
  }

  async #setupCacheDb(): Promise<void> {
    if (this.#vectorDb !== undefined) {
      return
    }

    this.#vectorDb = await this.#openDatabase()
  }

  // Insert data by generating embeddings from text
  async insert(data: StringPropertyInfo): Promise<void> {
    await this.#setupCacheDb()
    const embeddings: VectorEntry[] = []
    for (const group of data.valueGroups) {
      const embedding = await getEmbeddingFromText(group.value)
      for (const id of group.ids) {
        embeddings.push({
          id: this.#count++,
          baseId: id,
          vector: embedding,
          prop: group.value
        } as VectorEntry)
      }
    }
    await this.#vectorDb!.bulkInsert(embeddings)
  }

  // Query vectors by cosine similarity (using a text input that will be converted into embeddings)
  async query(queryText: string, limit = 10): Promise<QueryResult[]> {
    await this.#setupCacheDb()
    // Get embeddings for the query text
    const queryVector = await getEmbeddingFromText(queryText)
    const vectors = await this.#vectorDb!.getAll()
    // Calculate cosine similarity for each vector and sort by similarity
    const similarities = vectors.map((entry) => {
      const similarity = cosineSimilarity(queryVector, entry.vector)
      return { baseId: entry.baseId, similarity, value: entry.prop } as QueryResult
    })

    similarities.sort((a, b) => b.similarity - a.similarity) // Sort by similarity (descending)
    const sims = similarities.slice(0, limit) // Return the top N results based on limit
    return sims
  }
}
