import { ItemQueue } from '../../caching/ItemQueue.js'
import { DefermentManager } from '../../deferment/defermentManager.js'
import BatchingQueue from '../../queues/batchingQueue.js'
import { CustomLogger } from '../../types/functions.js'
import { Item } from '../../types/types.js'
import { RingBufferQueue } from '../../workers/RingBufferQueue.js'
import { WorkerMessageType } from '../../workers/WorkerMessageType.js'
import { CacheOptions } from '../options.js'
import { Writer } from './interfaces.js'

const DEFAULT_ENQUEUE_TIMEOUT_MS = 500
const BASE_BUFFER_CAPACITY_BYTES = 1024 * 1024 * 500 // 500MB capacity for each queue

export class CacheWriterWorker implements Writer {
  #writeQueue: BatchingQueue<Item> | undefined
  #logger: CustomLogger
    #options: CacheOptions
  #disposed = false
    #defermentManager: DefermentManager
    #requestItem: (id: string) => void
  private name: string = 'Speckle Cache Writer'

  mainToWorkerQueue?: ItemQueue
  indexedDbWriter?: Worker

  constructor(logger: CustomLogger, defermentManager: DefermentManager, requestItem: (id: string) => void, options: CacheOptions) {
    this.#logger = logger
    this.#defermentManager = defermentManager
    this.#requestItem = requestItem
    this.#options = options
    this.name = `[Speckle Cache Writer]`
    this.initializeIndexedDbWriter()
  }
  private logToMainUI(message: string): void {
    console.log(`[Main] ${message}`)
  }
  private initializeIndexedDbWriter(): void {
    this.logToMainUI('Initializing RingBufferQueues...')
    const rawMainToWorkerRbq = RingBufferQueue.create(
      BASE_BUFFER_CAPACITY_BYTES,
      this.name + ' ItemQueue MainToWorkerQueue'
    )
    this.mainToWorkerQueue = new ItemQueue(rawMainToWorkerRbq, this.#logger)
    const mainToWorkerSab = rawMainToWorkerRbq.getSharedArrayBuffer()
    this.logToMainUI(
      `Worker-to-Main ItemQueue created with ${
        BASE_BUFFER_CAPACITY_BYTES / 1024
      }KB capacity.`
    )

    this.logToMainUI('Starting Web Worker...')
    this.indexedDbWriter = new Worker(
      new URL('../../caching/WriterWorker.js', import.meta.url),
      { type: 'module', name: this.name }
    )

    this.logToMainUI('Sending SharedArrayBuffers and capacities to worker...')
    this.indexedDbWriter.postMessage({
      name: this.name,
      type: WorkerMessageType.INIT_QUEUES,
      mainToWorkerSab,
      mainToWorkerCapacityBytes: BASE_BUFFER_CAPACITY_BYTES
    })
  }

  /*add(item: Item): void {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.mainToWorkerQueue?.enqueueSingle(item, DEFAULT_ENQUEUE_TIMEOUT_MS)
  }*/
 add(item: Item): void {
    if (!this.#writeQueue) {
      this.#writeQueue = new BatchingQueue({
        batchSize: this.#options.maxCacheWriteSize,
        maxWaitTime: this.#options.maxCacheBatchWriteWait,
        processFunction: async (batch: Item[]): Promise<void> => {
          await this.writeAll(batch)
        }
      })
    }
    this.#writeQueue.add(item.baseId, item)
    this.#defermentManager.undefer(item, this.#requestItem)
  }

  async writeAll(items: Item[]): Promise<void> {
    const start = performance.now()
    await this.mainToWorkerQueue?.enqueue(items, DEFAULT_ENQUEUE_TIMEOUT_MS)
    this.#logger(
      `writeBatch: wrote ${items.length}, time ${
        performance.now() - start
      } ms left ${this.#writeQueue?.count()}`
    )
  }

  async disposeAsync(): Promise<void> {
    this.#disposed = true
    return Promise.resolve()
  }

  get isDisposed(): boolean {
    return this.#disposed
  }
}
