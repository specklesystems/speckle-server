import Queue from '../../helpers/queue.js'
import { Item } from '../../types/types.js'
import { ItemQueue } from '../../workers/ItemQueue.js'
import { RingBufferQueue } from '../../workers/RingBufferQueue.js'
import { StringQueue } from '../../workers/StringQueue.js'
import { handleError, WorkerMessageType } from '../../workers/WorkerMessageType.js'
import { Database } from '../interfaces.js'
import IndexedDatabase from './indexedDatabase.js'

const BUFFER_CAPACITY_BYTES = 1024 * 1024 * 16 // 16KB capacity for each queue

export interface WorkerMessage {
  type?: string
  mainToWorkerSab?: SharedArrayBuffer
  mainToWorkerCapacityBytes?: number
  workerToMainSab?: SharedArrayBuffer
  workerToMainCapacityBytes?: number
  error?: string
  message?: string
}

export class WorkerDatabase implements Database {
  private indexedDbReaderWorker: Worker | null = null
  private mainToWorkerQueue: StringQueue | null = null
  private workerToMainQueue: ItemQueue | null = null
  private workerCheckInterval: number | null = null

  private idb: Database = new IndexedDatabase({})
  private foundItems?: Queue<Item>
  private notFoundItems?: Queue<string>

  isDisposed(): boolean {
    return this.idb.isDisposed()
  }

  async initializeQueues(
    foundItems: Queue<Item>,
    notFoundItems: Queue<string>
  ): Promise<void> {
    this.foundItems = foundItems
    this.notFoundItems = notFoundItems
    this.initialize()
    void this.processWorkerMessages()
    return Promise.resolve()
  }

  async findBatch(keys: string[]): Promise<void> {
    await this.mainToWorkerQueue?.enqueue(keys)
  }
  cacheSaveBatch(params: { batch: Item[] }): Promise<void> {
    return this.idb.cacheSaveBatch(params)
  }
  private logToMainUI(message: string): void {
    console.log(`[Main] ${message}`)
  }

  private logToWorkerResponseUI(message: string): void {
    console.log(`[FromWorker] ${message}`)
  }

  public initialize(): void {
    if (typeof SharedArrayBuffer === 'undefined') {
      this.logToMainUI(
        'Error: SharedArrayBuffer is not available. This feature requires specific HTTP headers (COOP/COEP). Communication disabled.'
      )
      // Consider a more robust way to inform the UI about this critical error
      const commSection = document.querySelector('.communication-section h2')
      if (commSection) {
        const errorNote = document.createElement('p')
        errorNote.style.color = 'red'
        errorNote.textContent =
          'SharedArrayBuffer not available. Communication disabled.'
        commSection.parentElement?.insertBefore(errorNote, commSection.nextSibling)
      }
      return
    }

    if (typeof Worker === 'undefined') {
      this.logToMainUI('Error: Web Workers are not supported in this browser.')
      return
    }

    this.initializeIndexedDbReaderWorker()

    this.logToMainUI('Web Worker communication setup initiated.')
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
    this.initializeWorker(this.indexedDbReaderWorker)

    this.logToMainUI('Sending SharedArrayBuffers and capacities to worker...')
    this.indexedDbReaderWorker.postMessage({
      type: WorkerMessageType.INIT_QUEUES,
      mainToWorkerSab,
      mainToWorkerCapacityBytes: BUFFER_CAPACITY_BYTES,
      workerToMainSab,
      workerToMainCapacityBytes: BUFFER_CAPACITY_BYTES
    })
  }

  private initializeWorker(worker: Worker): void {
    worker.onmessage = (event: MessageEvent<WorkerMessage>): void => {
      if (event.data && event.data.type === 'WORKER_READY') {
        this.logToMainUI('Worker is ready and has initialized both queues.')
        if (this.workerCheckInterval === null) {
          this.workerCheckInterval = window.setInterval(
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            () =>
              this.processWorkerMessages().catch((e) =>
                handleError(
                  e,
                  (err) => `Error processing worker messages: ${err.message}`
                )
              ),
            1000
          )
        }
      } else if (event.data && event.data.type === 'WORKER_INIT_FAILED') {
        this.logToMainUI(`Worker failed to initialize: ${event.data.error}`)
      } else if (event.data && event.data.type === 'WORKER_LOG') {
        // this.logToMainUI(`[Worker Log] ${event.data.message}`); // Can be noisy
      } else {
        this.logToMainUI(
          `Received unknown message from worker: ${JSON.stringify(event.data)}`
        )
      }
    }

    worker.onerror = (error): void => {
      this.logToMainUI(`Error from worker: ${error.message}`)
      console.error('Worker error:', error)
      if (this.workerCheckInterval !== null) {
        clearInterval(this.workerCheckInterval)
        this.workerCheckInterval = null
      }
    }
  }

  private async processWorkerMessages(): Promise<void> {
    if (!this.workerToMainQueue) return
    try {
      while (!this.idb.isDisposed()) {
        const receivedItems = await this.workerToMainQueue.dequeue(10, 50)
        if (receivedItems && receivedItems.length > 0) {
          for (const item of receivedItems) {
            const i = JSON.stringify(item, null, 2)
            this.logToWorkerResponseUI(i)
            if (item.baseId) {
              this.foundItems?.add(item)
            } else {
              this.notFoundItems?.add(item.baseId)
            }
          }
        }
      }
    } catch (e: unknown) {
      handleError(e, (err) => `Error dequeueing message from worker: ${err.message}`)
    }
  }

  public async disposeAsync(): Promise<void> {
    if (this.indexedDbReaderWorker) {
      this.indexedDbReaderWorker.terminate()
      this.indexedDbReaderWorker = null
      this.logToMainUI('Worker terminated.')
    }
    if (this.workerCheckInterval !== null) {
      clearInterval(this.workerCheckInterval)
      this.workerCheckInterval = null
    }
    await this.idb.disposeAsync()
    this.logToMainUI('WorkerManager disposed.')
  }
}
