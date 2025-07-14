import { RingBufferQueue } from '../workers/RingBufferQueue.js'
import { StringQueue } from './StringQueue.js'
import { ItemQueue } from './ItemQueue.js'
import IndexedDatabase from '../core/stages/indexedDatabase.js'
import { Item } from '../types/types.js'
import { delay, isWhitespaceOnly } from '../types/functions.js'
import BatchingQueue from '../queues/batchingQueue.js'
import { WorkerCachingConstants } from './WorkerCachingConstants.js'

export class IndexDbReader {
  private workerToMainQueue: ItemQueue
  private mainToWorkerQueue: StringQueue
  private batchingQueue: BatchingQueue<string>
  private db: IndexedDatabase

  constructor(
    rawMainToWorkerRbq: RingBufferQueue,
    rawWorkerToMainRbq: RingBufferQueue
  ) {
    this.db = new IndexedDatabase({})
    this.mainToWorkerQueue = new StringQueue(
      rawMainToWorkerRbq,
      WorkerCachingConstants.DEFAULT_DEQUEUE_SIZE
    )
    this.workerToMainQueue = new ItemQueue(
      rawWorkerToMainRbq,
      WorkerCachingConstants.DEFAULT_ENQUEUE_SIZE
    )
    this.batchingQueue = new BatchingQueue<string>({
      batchSize: WorkerCachingConstants.DEFAULT_ENQUEUE_SIZE,
      maxWaitTime: WorkerCachingConstants.DEFAULT_ENQUEUE_TIMEOUT_MS,
      processFunction: (b): Promise<void> => this.processBatch(b)
    })
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
        if (isWhitespaceOnly(batch[i])) {
          this.log('Received a whitespace-only message, skipping it.')
          continue
        }
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

  private consolePrefix = '[Worker]'

  public log(message: string, ...args: unknown[]): void {
    console.log(`${this.consolePrefix} ${message}`, ...args)
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
        this.batchingQueue.addAll(receivedMessages, receivedMessages)
      } else {
        await delay(1000) // Wait for 1 second before checking again
      }
    }
  }
}
