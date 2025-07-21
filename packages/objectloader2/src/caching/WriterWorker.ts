import { RingBufferQueue } from '../workers/RingBufferQueue.js'
import { handleError, WorkerMessageType } from '../workers/WorkerMessageType.js'
import { InitQueuesMessage } from '../workers/InitQueuesMessage.js'
import { IndexDbWriter } from './IndexDbWriter.js'

let indexWriter: IndexDbWriter | null = null

let consolePrefix = '[Writer Worker]'

function log(message?: string, ...args: unknown[]): void {
  console.log(`${consolePrefix} ${message}`, ...args)
}

function postMessage(args: unknown): void {
  ;(self as unknown as Worker).postMessage(args)
}

async function processMessages(): Promise<void> {
  if (!indexWriter) {
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
    indexWriter.processMessages()
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
  if (typeof SharedArrayBuffer === 'undefined' || typeof Atomics === 'undefined') {
    const errorMsg = 'SharedArrayBuffer or Atomics not available in the worker scope.'
    log(`Error: ${errorMsg}`)
    postMessage({ type: 'WORKER_INIT_FAILED', error: errorMsg })
    return
  }

  if (
    data &&
    data.type === WorkerMessageType.INIT_QUEUES &&
    data.mainToWorkerSab instanceof SharedArrayBuffer &&
    typeof data.mainToWorkerCapacityBytes === 'number'
  ) {
    consolePrefix = data.name
    log(`Received INIT_QUEUES message.`)
    try {
      const rawMainToWorkerRbq = RingBufferQueue.fromExisting(
        data.mainToWorkerSab,
        data.mainToWorkerCapacityBytes,
        'StringQueue MainToWorkerQueue'
      )

      log('ItemQueue (main-to-worker) initialized successfully.')
      indexWriter = new IndexDbWriter(rawMainToWorkerRbq, log)

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
  } else {
    let errorDetail =
      'Received an unknown message type or invalid data for INIT_QUEUES.'
    if (!data) errorDetail = 'Received null or undefined data.'
    log(errorDetail, data)
    postMessage({ type: 'WORKER_INIT_FAILED', error: errorDetail })
  }
}

log('Worker script loaded. Waiting for INIT_QUEUES message.')
