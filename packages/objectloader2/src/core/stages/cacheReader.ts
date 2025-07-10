import { DefermentManager } from '../../deferment/defermentManager.js'
import Queue from '../../queues/queue.js'
import { CustomLogger } from '../../types/functions.js'
import { Item, Base } from '../../types/types.js'
import { ItemQueue } from '../../workers/ItemQueue.js'
import { MainRingBufferQueue } from '../../workers/MainRingBufferQueue.js'
import { StringQueue } from '../../workers/StringQueue.js'
import { WorkerMessageType } from '../../workers/WorkerMessageType.js'
import { CacheOptions } from '../options.js'

const BUFFER_CAPACITY_BYTES = 1024 * 1024 * 200 // 200MB

export class CacheReader {
  #defermentManager: DefermentManager
  #logger: CustomLogger
  #options: CacheOptions
  #foundQueue: Queue<Item> | undefined
  #notFoundQueue: Queue<string> | undefined

  mainToWorkerQueue?: StringQueue
  workerToMainQueue?: ItemQueue
  indexedDbReaderWorker?: Worker

  constructor(defermentManager: DefermentManager, options: CacheOptions) {
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
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.#processBatch()
  }

  private initializeIndexedDbReaderWorker(): void {
    this.logToMainUI('Initializing RingBufferQueues...')
    const rawMainToWorkerRbq = MainRingBufferQueue.create(
      BUFFER_CAPACITY_BYTES,
      'MainToWorkerQueue'
    )
    this.mainToWorkerQueue = new StringQueue(rawMainToWorkerRbq)
    const mainToWorkerSab = rawMainToWorkerRbq.getSharedArrayBuffer()
    this.logToMainUI(
      `Main-to-Worker StringQueue created with ${
        BUFFER_CAPACITY_BYTES / 1024
      }KB capacity.`
    )

    const rawWorkerToMainRbq = MainRingBufferQueue.create(
      BUFFER_CAPACITY_BYTES,
      'WorkerToMainQueue'
    )
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

  async getObject(params: { id: string }): Promise<Base> {
    const [p, b] = this.#defermentManager.defer({ id: params.id })
    if (!b) {
      await this.mainToWorkerQueue?.enqueue([params.id])
    }
    return await p
  }

  async requestAll(keys: string[]): Promise<void> {
    for (const key of keys) {
      this.#defermentManager.trackDefermentRequest(key)
    }

    await this.mainToWorkerQueue?.enqueue(keys)
  }

  #processBatch = async (): Promise<void> => {
    while (true) {
      const items = (await this.workerToMainQueue?.dequeue(10000, 5000)) || []
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
      this.#logger('readBatch: left, time', items.length, performance.now() - start)
    }
  }

  dispose(): void {}
}
