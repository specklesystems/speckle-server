import { RingBufferQueue } from '../workers/RingBufferQueue.js'
import { handleError, WorkerMessageType } from '../workers/WorkerMessageType.js'
import { InitQueuesMessage } from '../workers/InitQueuesMessage.js'
import { IndexDbReader } from './IndexDbReader.js'
import { canUseWorkers } from '../types/functions.js'

let indexReader: IndexDbReader | null = null

let consolePrefix = '[Reader Worker]'

function log(message: string, ...args: unknown[]): void {
  console.log(`${consolePrefix} ${message}`, ...args)
}

function postMessage(args: unknown): void {
  ;(self as unknown as Worker).postMessage(args)
}

async function processMessages(): Promise<void> {
  if (!indexReader) {
    log('Error: Queues not initialized. Stopping message processing.')
    ;(self as unknown as Worker).postMessage({
      type: 'WORKER_PROCESSING_ERROR',
      error: 'Queues not initialized in worker'
    })
    return
  }
  log('Starting to listen for messages from main thread...')
  try {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    indexReader.processMessages()
  } catch (e: unknown) {
    handleError(
      e,
      (err) => `Error during message dequeue or processing: ${err.message}`
    )
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

self.onmessage = (event: MessageEvent): void => {
  const data = event.data as InitQueuesMessage // Type assertion
  if (!canUseWorkers()) {
    const errorMsg = 'SharedArrayBuffer or Atomics not available in the worker scope.'
    log(`Error: ${errorMsg}`)
    postMessage({ type: 'WORKER_INIT_FAILED', error: errorMsg })
    return
  }

  if (
    data &&
    data.type === WorkerMessageType.INIT_QUEUES &&
    data.mainToWorkerSab instanceof SharedArrayBuffer &&
    typeof data.mainToWorkerCapacityBytes === 'number' &&
    data.workerToMainSab instanceof SharedArrayBuffer &&
    typeof data.workerToMainCapacityBytes === 'number'
  ) {
    consolePrefix = data.name
    log(`Received INIT_QUEUES message.`)
    try {
      const rawMainToWorkerRbq = RingBufferQueue.fromExisting(
        data.mainToWorkerSab,
        data.mainToWorkerCapacityBytes,
        'StringQueue MainToWorkerQueue'
      )

      log('StringQueue (main-to-worker) initialized successfully.')

      const rawWorkerToMainRbq = RingBufferQueue.fromExisting(
        data.workerToMainSab,
        data.workerToMainCapacityBytes,
        'ItemQueue WorkerToMainQueue'
      )
      log('ItemQueue (worker-to-main) initialized successfully.')
      indexReader = new IndexDbReader(data.name, rawMainToWorkerRbq, rawWorkerToMainRbq)

      postMessage({ type: 'WORKER_READY' })

      processMessages().catch((e) => {
        handleError(e, (err) => {
          const errorMsg = `Critical error in processMessages loop: ${err.message}`
          postMessage({ type: 'WORKER_PROCESSING_ERROR', error: errorMsg })
          return errorMsg
        })
      })
    } catch (e: unknown) {
      handleError(e, (err) => {
        const errorMsg = `Error initializing typed queues in worker:  ${err.message}`
        postMessage({ type: 'WORKER_INIT_FAILED', error: errorMsg })
        return errorMsg
      })
    }
  } else if (data && data.type === WorkerMessageType.DISPOSE) {
    indexReader?.dispose()
    indexReader = null
  } else {
    let errorDetail =
      'Received an unknown message type or invalid data for INIT_QUEUES.'
    if (!data) errorDetail = 'Received null or undefined data.'
    log(errorDetail, data)
    postMessage({ type: 'WORKER_INIT_FAILED', error: errorDetail })
  }
}

log('Worker script loaded. Waiting for INIT_QUEUES message.')
