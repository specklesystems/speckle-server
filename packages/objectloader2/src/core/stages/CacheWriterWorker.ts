import { ItemQueue } from '../../caching/ItemQueue.js'
import { DefermentManager } from '../../deferment/defermentManager.js'
import { CustomLogger } from '../../types/functions.js'
import { Item } from '../../types/types.js'
import { RingBufferQueue } from '../../workers/RingBufferQueue.js'
import { WorkerMessageType } from '../../workers/WorkerMessageType.js'
import { Writer } from './interfaces.js'

const BASE_BUFFER_CAPACITY_BYTES = 1024 * 1024 * 200 // 1MB capacity for each queue

export class CacheWriterWorker implements Writer {
  #logger: CustomLogger
  #disposed = false
  #defermentManager: DefermentManager
  #requestItem: (id: string) => void
  private name: string = 'Speckle Cache Writer'

  mainToWorkerQueue?: ItemQueue
  indexedDbWriter?: Worker

  constructor(
    logger: CustomLogger,
    defermentManager: DefermentManager,
    requestItem: (id: string) => void
  ) {
    this.#logger = logger
    this.#defermentManager = defermentManager
    this.#requestItem = requestItem
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
    this.mainToWorkerQueue = new ItemQueue(rawMainToWorkerRbq)
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

  async add(item: Item): Promise<void> {
    await this.mainToWorkerQueue?.enqueueSingle(item, 500)
    this.#defermentManager.undefer(item, this.#requestItem)
  }

  async disposeAsync(): Promise<void> {
    this.#disposed = true
    return Promise.resolve()
  }

  get isDisposed(): boolean {
    return this.#disposed
  }
}
