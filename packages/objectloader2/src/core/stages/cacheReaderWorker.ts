import { DefermentManager } from '../../deferment/defermentManager.js'
import Queue from '../../queues/queue.js'
import { CustomLogger } from '../../types/functions.js'
import { Item, Base } from '../../types/types.js'
import { ItemQueue } from '../../caching/ItemQueue.js'
import { RingBufferQueue } from '../../workers/RingBufferQueue.js'
import { StringQueue } from '../../caching/StringQueue.js'
import { WorkerMessageType } from '../../workers/WorkerMessageType.js'
import { CacheOptions } from '../options.js'
import { Reader } from './interfaces.js'
import { WorkerCachingConstants } from '../../caching/WorkerCachingConstants.js'

const ID_BUFFER_CAPACITY_BYTES = 1024 * 1024 // 5KB capacity for each queue
const BASE_BUFFER_CAPACITY_BYTES = 1024 * 1024 * 500 // 1MB capacity for each queue

export class CacheReaderWorker implements Reader {
  #defermentManager: DefermentManager
  #logger: CustomLogger
  #options: CacheOptions
  #foundQueue: Queue<Item> | undefined
  #notFoundQueue: Queue<string> | undefined

  private disposed = false

  mainToWorkerQueue?: StringQueue
  workerToMainQueue?: ItemQueue
  indexedDbReader?: Worker

  constructor(defermentManager: DefermentManager, options: CacheOptions) {
    this.#defermentManager = defermentManager
    this.#options = options
    this.#logger = options.logger || ((): void => {})
  }

  private logToMainUI(message: string): void {
    this.#logger(`[Main] ${message}`)
  }

  initializeQueue(foundQueue: Queue<Item>, notFoundQueue: Queue<string>): void {
    this.#foundQueue = foundQueue
    this.#notFoundQueue = notFoundQueue
    this.initializeIndexedDbReader()
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.#processBatch()
  }

  private initializeIndexedDbReader(): void {
    this.logToMainUI('Initializing RingBufferQueues...')
    const rawMainToWorkerRbq = RingBufferQueue.create(
      ID_BUFFER_CAPACITY_BYTES,
      'StringQueue MainToWorkerQueue'
    )
    this.mainToWorkerQueue = new StringQueue(rawMainToWorkerRbq, this.#logger)
    const mainToWorkerSab = rawMainToWorkerRbq.getSharedArrayBuffer()
    this.logToMainUI(
      `Main-to-Worker StringQueue created with ${
        ID_BUFFER_CAPACITY_BYTES / 1024
      }KB capacity.`
    )

    const rawWorkerToMainRbq = RingBufferQueue.create(
      BASE_BUFFER_CAPACITY_BYTES,
      'ItemQueue WorkerToMainQueue'
    )
    this.workerToMainQueue = new ItemQueue(rawWorkerToMainRbq, this.#logger)
    const workerToMainSab = rawWorkerToMainRbq.getSharedArrayBuffer()
    this.logToMainUI(
      `Worker-to-Main ItemQueue created with ${
        BASE_BUFFER_CAPACITY_BYTES / 1024
      }KB capacity.`
    )

    this.logToMainUI('Starting Web Worker...')
    this.indexedDbReader = new Worker(
      new URL('../../caching/ReaderWorker.js', import.meta.url),
      { type: 'module' }
    )

    this.logToMainUI('Sending SharedArrayBuffers and capacities to worker...')
    this.indexedDbReader.postMessage({
      type: WorkerMessageType.INIT_QUEUES,
      mainToWorkerSab,
      mainToWorkerCapacityBytes: ID_BUFFER_CAPACITY_BYTES,
      workerToMainSab,
      workerToMainCapacityBytes: BASE_BUFFER_CAPACITY_BYTES
    })
  }

  getObject(params: { id: string }): Promise<Base> {
    const [p, b] = this.#defermentManager.defer({ id: params.id })
    if (!b) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.mainToWorkerQueue?.fullyEnqueue(
        [params.id],
        WorkerCachingConstants.DEFAULT_ENQUEUE_TIMEOUT_MS
      )
    }
    return p
  }

  requestAll(keys: string[]): void {
    for (const key of keys) {
      this.#defermentManager.trackDefermentRequest(key)
    }
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.mainToWorkerQueue?.fullyEnqueue(
      keys,
      WorkerCachingConstants.DEFAULT_ENQUEUE_TIMEOUT_MS
    )
  }

  #processBatch = async (): Promise<void> => {
    while (true) {
      const items =
        (await this.workerToMainQueue?.dequeue(
          10000,
          WorkerCachingConstants.DEFAULT_DEQUEUE_TIMEOUT_MS
        )) || []
      if (this.disposed) {
        this.#logger('readBatch: disposed, exiting processing loop')
        return
      }
      if (items.length === 0) {
        this.#logger('readBatch: no items to process, waiting...')
        await new Promise((resolve) => setTimeout(resolve, 1000))
        continue
      }
      const start = performance.now()
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.base) {
          this.#foundQueue?.add(item)
          this.#defermentManager.undefer(item)
        } else {
          this.#notFoundQueue?.add(item.baseId)
        }
      }
      this.logToMainUI(
        'readBatch: left, time ' +
          items.length.toString() +
          ' ' +
          (performance.now() - start)
      )
    }
  }

  dispose(): void {
    this.disposed = true
  }
}
