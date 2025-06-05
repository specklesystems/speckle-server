// WorkerManager.ts
import { RingBufferQueue } from './RingBufferQueue.js'
import { LogErrorFunction, WorkerMessageType } from './WorkerMessageType.js'
import { StringQueue } from './StringQueue.js'
import { ItemQueue } from './ItemQueue.js'

const BUFFER_CAPACITY_BYTES = 1024 * 16 // 16KB capacity for each queue

type LogFunction = (message: string) => void
type SetButtonDisabledFunction = (disabled: boolean) => void
type SetInputDisabledFunction = (disabled: boolean) => void

export class WorkerManager {
  private indexedDbReaderWorker: Worker | null = null
  private mainToWorkerQueue: StringQueue | null = null
  private workerToMainQueue: ItemQueue | null = null
  private workerCheckInterval: number | null = null

  private logToMainUI: LogFunction
  private logErrorToMainUI: LogErrorFunction
  private logToWorkerResponseUI: (itemAsJson: string) => void
  private setSendMessageButtonDisabled: SetButtonDisabledFunction
  private setMessageInputDisabled: SetInputDisabledFunction

  constructor(
    logToMainUI: LogFunction,
    logErrorToMainUI: LogErrorFunction,
    logToWorkerResponseUI: (itemAsJson: string) => void,
    setSendMessageButtonDisabled: SetButtonDisabledFunction,
    setMessageInputDisabled: SetInputDisabledFunction
  ) {
    this.logToMainUI = logToMainUI
    this.logErrorToMainUI = logErrorToMainUI
    this.logToWorkerResponseUI = logToWorkerResponseUI
    this.setSendMessageButtonDisabled = setSendMessageButtonDisabled
    this.setMessageInputDisabled = setMessageInputDisabled
  }

  public initialize(): void {
    if (typeof SharedArrayBuffer === 'undefined') {
      this.logToMainUI(
        'Error: SharedArrayBuffer is not available. This feature requires specific HTTP headers (COOP/COEP). Communication disabled.'
      )
      this.setSendMessageButtonDisabled(true)
      this.setMessageInputDisabled(true)
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
      this.setSendMessageButtonDisabled(true)
      this.setMessageInputDisabled(true)
      return
    }

    this.initializeIndexedDbReaderWorker()

    this.setSendMessageButtonDisabled(true) // Initially disabled until worker is ready
    this.setMessageInputDisabled(true)
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
      new URL('./IndexDbReaderWorker.js', import.meta.url),
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
    worker.onmessage = (event): void => {
      if (event.data && event.data.type === 'WORKER_READY') {
        this.logToMainUI('Worker is ready and has initialized both queues.')
        this.setSendMessageButtonDisabled(false)
        this.setMessageInputDisabled(false)
        if (this.workerCheckInterval === null) {
          this.workerCheckInterval = window.setInterval(
            () => this.processWorkerMessages(),
            200
          )
        }
      } else if (event.data && event.data.type === 'WORKER_INIT_FAILED') {
        this.logToMainUI(`Worker failed to initialize: ${event.data.error}`)
        this.setSendMessageButtonDisabled(true)
        this.setMessageInputDisabled(true)
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
      this.setSendMessageButtonDisabled(true)
      this.setMessageInputDisabled(true)
      if (this.workerCheckInterval !== null) {
        clearInterval(this.workerCheckInterval)
        this.workerCheckInterval = null
      }
    }
  }

  private async processWorkerMessages(): Promise<void> {
    if (!this.workerToMainQueue) return
    try {
      const receivedItems = await this.workerToMainQueue.dequeue(10, 50)
      if (receivedItems && receivedItems.length > 0) {
        for (const item of receivedItems) {
          this.logToWorkerResponseUI(JSON.stringify(item, null, 2))
        }
      }
    } catch (e: unknown) {
      this.logErrorToMainUI(
        e,
        (err) => `Error dequeueing message from worker: ${err.message}`
      )
    }
  }

  public async sendMessage(messageText: string): Promise<boolean> {
    if (!this.mainToWorkerQueue) {
      this.logToMainUI('Error: Main-to-Worker queue not initialized.')
      return false
    }
    if (!messageText) {
      this.logToMainUI('Cannot send empty message.')
      return false
    }
    this.logToMainUI(`Original input: "${messageText}"`)
    this.setSendMessageButtonDisabled(true)
    try {
      const success = await this.mainToWorkerQueue.enqueue([messageText], 5000)
      if (success) {
        this.logToMainUI(`Message enqueued successfully.`)
        return true
      } else {
        this.logToMainUI(`Failed to enqueue message. Queue might be full or timed out.`)
        return false
      }
    } catch (e) {
      this.logToMainUI(`Error sending message: ${e.message}`)
      console.error('Error enqueuing message:', e)
      return false
    } finally {
      // Re-enable button if worker is still considered ready
      // This logic might need refinement based on worker state
      if (this.indexedDbReaderWorker && this.indexedDbReaderWorker.onmessage) {
        // A proxy for "worker seems operational"
        this.setSendMessageButtonDisabled(false)
      }
    }
  }

  public dispose(): void {
    if (this.indexedDbReaderWorker) {
      this.indexedDbReaderWorker.terminate()
      this.indexedDbReaderWorker = null
      this.logToMainUI('Worker terminated.')
    }
    if (this.workerCheckInterval !== null) {
      clearInterval(this.workerCheckInterval)
      this.workerCheckInterval = null
    }
    this.setSendMessageButtonDisabled(true)
    this.setMessageInputDisabled(true)
    this.logToMainUI('WorkerManager disposed.')
  }
}
