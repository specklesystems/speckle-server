import { RingBufferQueue } from '../workers/RingBufferQueue.js'
import { StringQueue } from './StringQueue.js'
import { ItemQueue } from './ItemQueue.js'
import IndexedDatabase from '../core/stages/indexedDatabase.js'
import { Item } from '../types/types.js'
import { delay } from '../types/functions.js'
import { WorkerCachingConstants } from './WorkerCachingConstants.js'

const READER_BATCH_SIZE = 5000 // Number of items to read in a single batch

export class IndexDbReader {
  private workerToMainQueue: ItemQueue
  private mainToWorkerQueue: StringQueue
  private db: IndexedDatabase
  private name: string
  private disposed: boolean = false

  constructor(
    name: string,
    rawMainToWorkerRbq: RingBufferQueue,
    rawWorkerToMainRbq: RingBufferQueue
  ) {
    this.name = name
    this.db = new IndexedDatabase({})
    this.mainToWorkerQueue = new StringQueue(
      rawMainToWorkerRbq,
      (m?: string, ...p: unknown[]) => this.log(m ?? '', ...p)
    )
    this.workerToMainQueue = new ItemQueue(
      rawWorkerToMainRbq,
      (m?: string, ...p: unknown[]) => this.log(m ?? '', ...p)
    )
  }

  private async processBatch(batch: string[]): Promise<void> {
    const start = performance.now()
    const items = await this.db.getAll(batch)
    const processedItems: Item[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item) {
        processedItems.push(item)
      } else {
        processedItems.push({ baseId: batch[i] })
      }
    }
    this.log(
      `Processed ${processedItems.length} items in ${performance.now() - start}ms`
    )
    //await here to fully enqueue before reading more items
    await this.workerToMainQueue?.fullyEnqueue(
      processedItems,
      WorkerCachingConstants.DEFAULT_ENQUEUE_TIMEOUT_MS
    )
  }

  public log(message: string, ...args: unknown[]): void {
    console.log(`[debug] ${this.name} ${message}`, ...args)
  }

  public static postMessage(args: unknown): void {
    ;(self as unknown as Worker).postMessage(args)
  }

  public async processMessages(): Promise<void> {
    while (!this.disposed) {
      const receivedMessages = await this.mainToWorkerQueue.dequeue(
        READER_BATCH_SIZE,
        WorkerCachingConstants.DEFAULT_ENQUEUE_TIMEOUT_MS
      ) // receivedMessages will be string[]
      if (receivedMessages && receivedMessages.length > 0) {
        await this.processBatch(receivedMessages)
      } else {
        await delay(1000) // Wait for 1 second before checking again
      }
    }
  }

  dispose(): void {
    this.log('Disposing IndexDbReader...')
    this.disposed = true
  }
}
