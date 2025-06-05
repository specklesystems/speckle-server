import { RingBufferQueue } from './RingBufferQueue.js'
import { Item } from './RingBufferState.js'
import { StringQueue } from './StringQueue.js'
import { ItemQueue } from './ItemQueue.js'
import { handleError, WorkerMessageType } from './WorkerMessageType.js'
import { InitQueuesMessage } from './InitQueuesMessage.js'

let workerToMainQueue: ItemQueue | null = null
let mainToWorkerQueue: StringQueue | null = null

const consolePrefix = '[Worker]'

function log(message: string, ...args: unknown[]): void {
  console.log(`${consolePrefix} ${message}`, ...args)
}

function postMessage(args: unknown): void {
  ;(self as unknown as Worker).postMessage(args)
}

async function processMessages(): Promise<void> {
  if (!mainToWorkerQueue || !workerToMainQueue) {
    log('Error: Queues not initialized. Stopping message processing.')
    ;(self as unknown as Worker).postMessage({
      type: 'WORKER_PROCESSING_ERROR',
      error: 'Queues not initialized in worker'
    })
    return
  }
  log('Starting to listen for messages from main thread...')
  while (true) {
    try {
      // Dequeue 1 string message. StringDataMessage is now just string.
      const receivedMessages = await mainToWorkerQueue.dequeue(1, 500) // receivedMessages will be string[]
      if (receivedMessages && receivedMessages.length > 0) {
        for (const receivedString of receivedMessages) {
          // receivedString is a string
          log(`Received message (string): "${receivedString}"`)

          // Use the receivedString (which is already processed to 32-byte representation)
          // to generate the Item.

          const newItem: Item = {
            baseId: `item-${receivedString.substring(0, 16)}-${Date.now()}`,
            base: {
              id: `base-${receivedString.length}-${Date.now()}`, // or use receivedString.length
              speckle_type: 'ProcessedStringItem',
              __closure: {
                sourceStringLengthAfter32ByteProcessing: receivedString.length
              }
            },
            size: receivedString.length // or receivedString.length (UTF-8 bytes can differ from char length)
          }

          log(`Constructed Item: ${JSON.stringify(newItem)}`)

          const success = await workerToMainQueue.enqueue([newItem], 500)
          if (success) {
            log(`Item enqueued to workerToMainQueue successfully.`)
          } else {
            log(`Failed to enqueue Item to workerToMainQueue.`)
          }
        }
      }
    } catch (e: unknown) {
      handleError(
        e,
        (err) => `Error during message dequeue or processing: ${err.message}`
      )
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
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
    typeof data.mainToWorkerCapacityBytes === 'number' &&
    data.workerToMainSab instanceof SharedArrayBuffer &&
    typeof data.workerToMainCapacityBytes === 'number'
  ) {
    log(`Received INIT_QUEUES message.`)
    try {
      const rawMainToWorkerRbq = RingBufferQueue.fromExisting(
        data.mainToWorkerSab,
        data.mainToWorkerCapacityBytes
      )
      mainToWorkerQueue = new StringQueue(rawMainToWorkerRbq)
      log('StringQueue (main-to-worker) initialized successfully.')

      const rawWorkerToMainRbq = RingBufferQueue.fromExisting(
        data.workerToMainSab,
        data.workerToMainCapacityBytes
      )
      workerToMainQueue = new ItemQueue(rawWorkerToMainRbq)
      log('ItemQueue (worker-to-main) initialized successfully.')

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
