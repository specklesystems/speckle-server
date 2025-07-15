import { RingBufferQueue } from '../workers/RingBufferQueue.js'
import { ItemQueue } from './ItemQueue.js'
import IndexedDatabase from '../core/stages/indexedDatabase.js'
import { Item } from '../types/types.js'
import BatchingQueue from '../queues/batchingQueue.js'
import { WorkerCachingConstants } from './WorkerCachingConstants.js'

export class IndexDbWriter {
  private mainToWorkerQueue: ItemQueue
  private batchingQueue: BatchingQueue<Item>
  private db: IndexedDatabase

  constructor(rawMainToWorkerRbq: RingBufferQueue) {
    this.db = new IndexedDatabase({})
    this.mainToWorkerQueue = new ItemQueue(
      rawMainToWorkerRbq,
      WorkerCachingConstants.DEFAULT_ENQUEUE_SIZE
    )
    this.batchingQueue = new BatchingQueue<Item>({
      batchSize: WorkerCachingConstants.DEFAULT_ENQUEUE_SIZE,
      maxWaitTime: WorkerCachingConstants.DEFAULT_ENQUEUE_TIMEOUT_MS,
      processFunction: (b): Promise<void> => this.processBatch(b)
    })
  }

  private async processBatch(batch: Item[]): Promise<void> {
    const start = performance.now()
    await this.db.saveBatch({ batch })
    this.log(`Saved ${batch.length} items in ${performance.now() - start}ms`)
  }

  private consolePrefix = '[Writer Worker]'

  public log(message: string, ...args: unknown[]): void {
    console.log(`${this.consolePrefix} ${message}`, ...args)
  }

  public static postMessage(args: unknown): void {
    ;(self as unknown as Worker).postMessage(args)
  }

  public async processMessages(): Promise<void> {
    const receivedMessages = await this.mainToWorkerQueue.dequeue(
      WorkerCachingConstants.DEFAULT_ENQUEUE_SIZE,
      WorkerCachingConstants.DEFAULT_ENQUEUE_TIMEOUT_MS
    ) // receivedMessages will be string[]
    if (receivedMessages && receivedMessages.length > 0) {
      this.batchingQueue.addAll(
        receivedMessages.map((x) => x.baseId),
        receivedMessages
      )
    }
  }
}
