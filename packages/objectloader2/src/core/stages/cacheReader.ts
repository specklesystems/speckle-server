import { DefermentManager } from '../../deferment/defermentManager.js'
import BatchingQueue from '../../queues/batchingQueue.js'
import Queue from '../../queues/queue.js'
import { CustomLogger } from '../../types/functions.js'
import { Item, Base } from '../../types/types.js'
import { ItemQueue } from '../../workers/ItemQueue.js'
import { RingBufferQueue } from '../../workers/RingBufferQueue.js'
import { StringQueue } from '../../workers/StringQueue.js'
import { WorkerMessageType } from '../../workers/WorkerMessageType.js'
import { Database } from '../interfaces.js'
import { CacheOptions } from '../options.js'

const BUFFER_CAPACITY_BYTES = 1024 * 1024 * 1024 // 1GB

export class CacheReader {
  #database: Database
  #defermentManager: DefermentManager
  #logger: CustomLogger
  #options: CacheOptions
  #readQueue: BatchingQueue<string> | undefined
  #foundQueue: Queue<Item> | undefined
  #notFoundQueue: Queue<string> | undefined

  mainToWorkerQueue?: StringQueue
  workerToMainQueue?: ItemQueue
  indexedDbReaderWorker?: Worker

  constructor(
    database: Database,
    defermentManager: DefermentManager,
    options: CacheOptions
  ) {
    this.#database = database
    this.#defermentManager = defermentManager
    this.#options = options
    this.#logger = options.logger || ((): void => {})
  }

  private logToMainUI(message: string): void {
    console.log(`[Main] ${message}`)
  }

  private logToWorkerResponseUI(message: string): void {
    console.log(`[FromWorker] ${message}`)
  }

  initializeQueue(foundQueue: Queue<Item>, notFoundQueue: Queue<string>): void {
    this.#foundQueue = foundQueue
    this.#notFoundQueue = notFoundQueue
    this.initializeIndexedDbReaderWorker()
  }

  private initializeIndexedDbReaderWorker(): void {
    this.logToMainUI('Initializing RingBufferQueues...')
    const rawMainToWorkerRbq = RingBufferQueue.create(BUFFER_CAPACITY_BYTES)
    this.mainToWorkerQueue = new StringQueue(rawMainToWorkerRbq)
    const mainToWorkerSab = rawMainToWorkerRbq.getSharedArrayBuffer()
    this.logToMainUI(
      `Main-to-Worker StringQueue created with ${
        BUFFER_CAPACITY_BYTES / 1024
      }KB capacity.`
    )

    const rawWorkerToMainRbq = RingBufferQueue.create(BUFFER_CAPACITY_BYTES)
    this.workerToMainQueue = new ItemQueue(rawWorkerToMainRbq)
    const workerToMainSab = rawWorkerToMainRbq.getSharedArrayBuffer()
    this.logToMainUI(
      `Worker-to-Main ItemQueue created with ${
        BUFFER_CAPACITY_BYTES / 1024
      }KB capacity.`
    )

    this.logToMainUI('Starting Web Worker...')
    this.indexedDbReaderWorker = new Worker(
      new URL('../../workers/IndexDbReaderWorker.js', import.meta.url),
      { type: 'module' }
    )

    this.logToMainUI('Sending SharedArrayBuffers and capacities to worker...')
    this.indexedDbReaderWorker.postMessage({
      type: WorkerMessageType.INIT_QUEUES,
      mainToWorkerSab,
      mainToWorkerCapacityBytes: BUFFER_CAPACITY_BYTES,
      workerToMainSab,
      workerToMainCapacityBytes: BUFFER_CAPACITY_BYTES
    })
  }

  getObject(params: { id: string }): Promise<Base> {
    const [p, b] = this.#defermentManager.defer({ id: params.id })
    if (!b) {
      this.#requestItem(params.id)
    }
    return p
  }

  #createReadQueue(): void {
    if (!this.#readQueue) {
      this.#readQueue = new BatchingQueue({
        batchSize: this.#options.maxCacheReadSize,
        maxWaitTime: this.#options.maxCacheBatchReadWait,
        processFunction: this.#processBatch
      })
    }
  }

  #requestItem(id: string): void {
    this.#createReadQueue()
    if (!this.#readQueue?.get(id)) {
      this.#readQueue?.add(id, id)
    }
  }

  requestAll(keys: string[]): void {
    this.#createReadQueue()
    for (const key of keys) {
      this.#defermentManager.trackDefermentRequest(key)
    }

    this.#readQueue?.addAll(keys, keys)
  }

  #processBatch = async (batch: string[]): Promise<void> => {
    const start = performance.now()
    const items = await this.#database.getAll(batch)
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item) {
        this.#foundQueue?.add(item)
        this.#defermentManager.undefer(item)
      } else {
        this.#notFoundQueue?.add(batch[i])
      }
    }
    this.#logger('readBatch: left, time', items.length, performance.now() - start)
  }

  dispose(): void {
    this.#readQueue?.dispose()
  }
}
