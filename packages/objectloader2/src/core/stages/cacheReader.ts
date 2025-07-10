import { DefermentManager } from '../../deferment/defermentManager.js'
import Queue from '../../queues/queue.js'
import { CustomLogger } from '../../types/functions.js'
import { Item, Base } from '../../types/types.js'
import { ItemQueue } from '../../workers/ItemQueue.js'
import { MainRingBufferQueue } from '../../workers/MainRingBufferQueue.js'
import { RingBuffer } from '../../workers/RingBuffer.js'
import { StringQueue } from '../../workers/StringQueue.js'
import { WorkerMessageType } from '../../workers/WorkerMessageType.js'
import { CacheOptions } from '../options.js'

const ID_BUFFER_CAPACITY_BYTES = 1024 * 50 // 5KB capacity for each queue
const BASE_BUFFER_CAPACITY_BYTES = 1024 * 1024 // 1MB capacity for each queue

export class CacheReader {
  #defermentManager: DefermentManager
  #logger: CustomLogger
  #options: CacheOptions
  #foundQueue: Queue<Item> | undefined
  #notFoundQueue: Queue<string> | undefined

  mainToWorkerQueue?: StringQueue
  workerToMainQueue?: ItemQueue
  indexedDbReader?: Worker

  constructor(defermentManager: DefermentManager, options: CacheOptions) {
    this.#defermentManager = defermentManager
    this.#options = options
    this.#logger = options.logger || ((): void => {})
  }

  private logToMainUI(message: string): void {
    console.log(`[Main] ${message}`)
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
    const rawMainToWorkerRbq = MainRingBufferQueue.create(
      ID_BUFFER_CAPACITY_BYTES,
      'StringQueue MainToWorkerQueue'
    )
    this.mainToWorkerQueue = new StringQueue(rawMainToWorkerRbq)
    const mainToWorkerSab = rawMainToWorkerRbq.getSharedArrayBuffer()
    this.logToMainUI(
      `Main-to-Worker StringQueue created with ${
        ID_BUFFER_CAPACITY_BYTES / 1024
      }KB capacity.`
    )

    const rawWorkerToMainRbq = MainRingBufferQueue.create(
      BASE_BUFFER_CAPACITY_BYTES,
      'ItemQueue WorkerToMainQueue'
    )
    this.workerToMainQueue = new ItemQueue(rawWorkerToMainRbq)
    const workerToMainSab = rawWorkerToMainRbq.getSharedArrayBuffer()
    this.logToMainUI(
      `Worker-to-Main ItemQueue created with ${
        BASE_BUFFER_CAPACITY_BYTES / 1024
      }KB capacity.`
    )

    this.logToMainUI('Starting Web Worker...')
    this.indexedDbReader = new Worker(
      new URL('../../workers/IndexDbReader.js', import.meta.url),
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

  async getObject(params: { id: string }): Promise<Base> {
    const [p, b] = this.#defermentManager.defer({ id: params.id })
    if (!b) {
      while (
        !(await this.mainToWorkerQueue?.enqueue(
          [params.id],
          RingBuffer.DEFAULT_ENQUEUE_TIMEOUT_MS
        ))
      ) {
        this.#logger('getObject: retrying enqueue for id', params.id)
      }
    }
    return await p
  }

  async requestAll(keys: string[]): Promise<void> {
    for (const key of keys) {
      this.#defermentManager.trackDefermentRequest(key)
    }

    while (keys.length > 0) {
      const s = keys.slice(0, RingBuffer.DEFAULT_ENQUEUE_SIZE)
      while (
        !(await this.mainToWorkerQueue?.enqueue(
          s,
          RingBuffer.DEFAULT_ENQUEUE_TIMEOUT_MS
        ))
      ) {
        this.#logger('requestAll: retrying enqueue for items', s.length)
      }
    }
  }

  #processBatch = async (): Promise<void> => {
    while (true) {
      const items =
        (await this.workerToMainQueue?.dequeue(
          RingBuffer.DEFAULT_DEQUEUE_SIZE,
          RingBuffer.DEFAULT_DEQUEUE_TIMEOUT_MS
        )) || []
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
