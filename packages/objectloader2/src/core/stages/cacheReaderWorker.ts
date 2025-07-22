import { DefermentManager } from '../../deferment/defermentManager.js'
import Queue from '../../queues/queue.js'
import { CustomLogger, delay } from '../../types/functions.js'
import { Item, Base } from '../../types/types.js'
import { ItemQueue } from '../../caching/ItemQueue.js'
import { RingBufferQueue } from '../../workers/RingBufferQueue.js'
import { StringQueue } from '../../caching/StringQueue.js'
import { WorkerMessageType } from '../../workers/WorkerMessageType.js'
import { Reader } from './interfaces.js'
import { WorkerCachingConstants } from '../../caching/WorkerCachingConstants.js'

const ID_BUFFER_CAPACITY_BYTES = 1024 * 1024 // 1MB capacity for each queue
const BASE_BUFFER_CAPACITY_BYTES = 1024 * 1024 * 500 // 500MB capacity for each queue

export class CacheReaderWorker implements Reader {
  #defermentManager: DefermentManager
  #logger: CustomLogger
  #foundQueue: Queue<Item> | undefined
  #notFoundQueue: Queue<string> | undefined
  #requestedItems: Set<string> = new Set()

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
    this.#logger(`[ObjectLoader2] ${message}`)
  }

  initializeQueue(foundQueue: Queue<Item>, notFoundQueue: Queue<string>): void {
    this.#foundQueue = foundQueue
    this.#notFoundQueue = notFoundQueue
    this.initializeIndexedDbReader()
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.#processBatch()
  }

  requestItem(id: string): void {
    if (this.#requestedItems.has(id)) {
      return
    }
    this.#requestedItems.add(id)
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
      this.name + ' MainToWorkerQueue'
    )
    this.mainToWorkerQueue = new StringQueue(rawMainToWorkerRbq, this.#logger)
    const mainToWorkerSab = rawMainToWorkerRbq.getSharedArrayBuffer()
    const rawWorkerToMainRbq = RingBufferQueue.create(
      BASE_BUFFER_CAPACITY_BYTES,
      this.name + ' WorkerToMainQueue'
    )
    this.workerToMainQueue = new ItemQueue(rawWorkerToMainRbq, this.#logger)
    const workerToMainSab = rawWorkerToMainRbq.getSharedArrayBuffer()

    this.indexedDbReader = new Worker(
      new URL('../../caching/ReaderWorker.js', import.meta.url),
      { type: 'module', name: this.name }
    )

    this.logToMainUI(
      'Worker started, sending SharedArrayBuffers and capacities to worker...'
    )
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
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this.mainToWorkerQueue?.enqueue(
        [params.id],
        WorkerCachingConstants.DEFAULT_ENQUEUE_TIMEOUT_MS
      )
    }
    return p
  }

  requestAll(keys: string[]): void {
    keys.forEach((key) => {
      this.#requestedItems.add(key)
    })
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
        this.logToMainUI(`processBatch: disposed, exiting processing loop`)
        return
      }
      if (items.length === 0) {
        this.logToMainUI(`processBatch: no items to process, waiting...`)
        await delay(1000)
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
        `processBatch: items processed ${items.length.toString()}, time ${
          performance.now() - start
        }`
      )
    }
  }

  disposeAsync(): Promise<void> {
    this.disposed = true
    this.indexedDbReader?.postMessage({
      type: WorkerMessageType.DISPOSE
    })
    this.indexedDbReader?.terminate()
    this.#requestedItems.clear()
    return Promise.resolve()
  }

  get readQueueSize(): number {
    return this.mainToWorkerQueue?.count || 0
  }
}
