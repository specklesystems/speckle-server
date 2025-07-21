import { DefermentManager } from '../../deferment/defermentManager.js'
import Queue from '../../queues/queue.js'
import { CustomLogger } from '../../types/functions.js'
import { Item, Base } from '../../types/types.js'
import { ItemQueue } from '../../caching/ItemQueue.js'
import { RingBufferQueue } from '../../workers/RingBufferQueue.js'
import { StringQueue } from '../../caching/StringQueue.js'
import { WorkerMessageType } from '../../workers/WorkerMessageType.js'
import { Reader } from './interfaces.js'
import { WorkerCachingConstants } from '../../caching/WorkerCachingConstants.js'

const ID_BUFFER_CAPACITY_BYTES = 1024 * 1024 // 1MB capacity for each queue
const BASE_BUFFER_CAPACITY_BYTES = 1024 * 1024 * 500 // 1MB capacity for each queue

export class CacheReaderWorker implements Reader {
  #defermentManager: DefermentManager
  #logger: CustomLogger
  #foundQueue: Queue<Item> | undefined
  #notFoundQueue: Queue<string> | undefined

  private disposed = false

  mainToWorkerQueue?: StringQueue
  workerToMainQueue?: ItemQueue
  indexedDbReader?: Worker
  private name: string

  constructor(defermentManager: DefermentManager, count: number, logger: CustomLogger) {
    this.#defermentManager = defermentManager
    this.name = `[Speckle Cache Reader ${count}]`
    this.#logger = logger
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

  requestItem(id: string): void {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.mainToWorkerQueue?.enqueue(
      [id],
      WorkerCachingConstants.DEFAULT_ENQUEUE_TIMEOUT_MS
    )
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
      { type: 'module', name: this.name }
    )

    this.logToMainUI('Sending SharedArrayBuffers and capacities to worker...')
    this.indexedDbReader.postMessage({
      name: this.name,
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
      this.requestItem(params.id)
    }
    return p
  }

  requestAll(keys: string[]): void {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.mainToWorkerQueue?.fullyEnqueue(
      keys,
      WorkerCachingConstants.DEFAULT_ENQUEUE_TIMEOUT_MS
    )
  }

  async enqueue(items: string[], timeoutMs: number): Promise<number> {
    return this.mainToWorkerQueue!.enqueue(items, timeoutMs)
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
          this.#defermentManager.undefer(item, (id) => this.requestItem(id))
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

   disposeAsync(): Promise<void> {
    this.disposed = true
    this.indexedDbReader?.postMessage({
      type: WorkerMessageType.DISPOSE
    })
    this.indexedDbReader?.terminate()
    return Promise.resolve()
  }
}
