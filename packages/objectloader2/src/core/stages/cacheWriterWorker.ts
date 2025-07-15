import { ItemQueue } from '../../caching/ItemQueue.js'
import { DefermentManager } from '../../deferment/defermentManager.js'
import { CustomLogger } from '../../types/functions.js'
import { Item } from '../../types/types.js'
import { RingBufferQueue } from '../../workers/RingBufferQueue.js'
import { WorkerMessageType } from '../../workers/WorkerMessageType.js'
import { CacheOptions } from '../options.js'
import { Writer } from './interfaces.js'

const DEFAULT_ENQUEUE_SIZE = 5000
const DEFAULT_ENQUEUE_TIMEOUT_MS = 500
const BASE_BUFFER_CAPACITY_BYTES = 1024 * 1024 * 500 // 1MB capacity for each queue

export class CacheWriterWorker implements Writer {
  #defermentManager: DefermentManager
  #logger: CustomLogger
  #options: CacheOptions
  #disposed = false

  mainToWorkerQueue?: ItemQueue
  indexedDbWriter?: Worker

  constructor(defermentManager: DefermentManager, options: CacheOptions) {
    this.#defermentManager = defermentManager
    this.#options = options
    this.#logger = options.logger || ((): void => {})
    this.initializeIndexedDbWriter()
  }
  private logToMainUI(message: string): void {
    console.log(`[Main] ${message}`)
  }
  private initializeIndexedDbWriter(): void {
    this.logToMainUI('Initializing RingBufferQueues...')
    const rawMainToWorkerRbq = RingBufferQueue.create(
      BASE_BUFFER_CAPACITY_BYTES,
      'ItemQueue MainToWorkerQueue'
    )
    this.mainToWorkerQueue = new ItemQueue(
      rawMainToWorkerRbq,
      DEFAULT_ENQUEUE_SIZE,
      this.#logger
    )
    const mainToWorkerSab = rawMainToWorkerRbq.getSharedArrayBuffer()
    this.logToMainUI(
      `Worker-to-Main ItemQueue created with ${
        BASE_BUFFER_CAPACITY_BYTES / 1024
      }KB capacity.`
    )

    this.logToMainUI('Starting Web Worker...')
    this.indexedDbWriter = new Worker(
      new URL('../../caching/WriterWorker.js', import.meta.url),
      { type: 'module' }
    )

    this.logToMainUI('Sending SharedArrayBuffers and capacities to worker...')
    this.indexedDbWriter.postMessage({
      type: WorkerMessageType.INIT_QUEUES,
      mainToWorkerSab,
      mainToWorkerCapacityBytes: BASE_BUFFER_CAPACITY_BYTES
    })
  }

  add(item: Item): void {
    this.#defermentManager.undefer(item)
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.mainToWorkerQueue?.enqueue([item], DEFAULT_ENQUEUE_TIMEOUT_MS)
  }

  writeAll(items: Item[]): Promise<void> {
    const start = performance.now()
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.mainToWorkerQueue?.fullyEnqueue(items, DEFAULT_ENQUEUE_TIMEOUT_MS)
    this.#logger('writeBatch: left, time', items.length, performance.now() - start)
    return Promise.resolve()
  }

  async disposeAsync(): Promise<void> {
    this.#disposed = true
    return Promise.resolve()
  }

  get isDisposed(): boolean {
    return this.#disposed
  }
}
