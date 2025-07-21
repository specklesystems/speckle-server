import { RingBufferQueue } from '../workers/RingBufferQueue.js'
import { StringQueue } from './StringQueue.js'
import { ItemQueue } from './ItemQueue.js'
import IndexedDatabase from '../core/stages/indexedDatabase.js'
import { Item } from '../types/types.js'
import { delay } from '../types/functions.js'
import { WorkerCachingConstants } from './WorkerCachingConstants.js'

export class IndexDbReader {
  private workerToMainQueue: ItemQueue
  private mainToWorkerQueue: StringQueue
  private db: IndexedDatabase
  private name: string

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
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.workerToMainQueue?.fullyEnqueue(
      processedItems,
      WorkerCachingConstants.DEFAULT_ENQUEUE_TIMEOUT_MS
    )
  }

  public log(message: string, ...args: unknown[]): void {
    console.log(`${this.name} ${message}`, ...args)
  }

  public static postMessage(args: unknown): void {
    ;(self as unknown as Worker).postMessage(args)
  }

  public async processMessages(): Promise<void> {
    while (true) {
      const receivedMessages = await this.mainToWorkerQueue.dequeue(
        WorkerCachingConstants.DEFAULT_ENQUEUE_SIZE,
        WorkerCachingConstants.DEFAULT_ENQUEUE_TIMEOUT_MS
      ) // receivedMessages will be string[]
      if (receivedMessages && receivedMessages.length > 0) {
        await this.processBatch(receivedMessages)
      } else {
        await delay(1000) // Wait for 1 second before checking again
      }
    }
  }
}
