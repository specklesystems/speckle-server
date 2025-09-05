/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { SententizedBase } from './PropertyManager.js'
import { CustomLogger } from '../types/functions.js'
import { VectorEntry, VectorStore } from './VectorStore.js'
let status: string = 'Loading model...'

class PipelineSingleton {
  static task = 'feature-extraction'
  static model = 'Xenova/all-MiniLM-L6-v2'
  static instance?: any = null

  static async getInstance(progress_callback: any): Promise<any> {
    if (this.instance) {
      return this.instance
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { pipeline } = await import('@huggingface/transformers')
    this.instance ??= pipeline(this.task as any, this.model, {
      device: "webgpu",
      progress_callback
    })
    return this.instance
  }
  static async countTokens(text: string): Promise<number> {

    const { AutoTokenizer } = await import('@huggingface/transformers')
    // Load the tokenizer for the specific model.
    // The tokenizer will be cached after the first time it's loaded.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
    const tokenizer = await AutoTokenizer.from_pretrained(this.model)

    // Encode the text and get the array of token IDs.
    const tokenized = tokenizer(text)

    // The length of the array is the number of tokens.
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return tokenized.input_ids.size
  }
}

export interface QueryResult {
  baseId: string
  similarity: number
  value: string
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
  const pipe = await PipelineSingleton.getInstance((c: any) => {
    if (status !== c.status) {
      status = c.status as string
      console.log(`Loading model: ${c.status}`)
    }
  })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  const output = await pipe(text, {
    pooling: 'mean',
    normalize: true
  })
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return Array.from(output.data)
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

  // Insert data by generating embeddings from text for a batch of items
  async insert(data: SententizedBase[]): Promise<void> {
    if (data.length === 0) return

    await this.#setupCacheDb()

    // Process embeddings in parallel for better performance
    const embeddingPromises = data.map((item) =>
      getEmbeddingFromText(item.props).then(
        (vector) =>
          ({
            baseId: item.id,
            vector,
            prop: item.props
          } as VectorEntry)
      )
    )

    const embeddings = await Promise.all(embeddingPromises)

    // Batch insert all embeddings in a single IndexedDB transaction
    /*await this.#vectorDb!.bulkInsert(embeddings)*/
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
