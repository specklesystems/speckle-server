import { RingBufferQueue } from './RingBufferQueue.js'
import { StringQueue } from './StringQueue.js'
import { ItemQueue } from './ItemQueue.js'
import { handleError, WorkerMessageType } from './WorkerMessageType.js'
import { InitQueuesMessage } from './InitQueuesMessage.js'
import IndexedDatabase from '../operations/databases/indexedDatabase.js'
import { Item } from '../types/types.js'

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
  const db = new IndexedDatabase({})
  log('Starting to listen for messages from main thread...')
  while (true) {
    try {
      const receivedMessages = await mainToWorkerQueue.dequeue(1, 500) // receivedMessages will be string[]
      if (receivedMessages && receivedMessages.length > 0) {
        const items = await db.getAll(receivedMessages)
        const processedItems: Item[] = []
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          if (item) {
            processedItems.push(item)
          } else {
            processedItems.push({ baseId: receivedMessages[i] })
          }
        }
        const success = await workerToMainQueue.enqueue(processedItems, 500)
        if (success) {
          log(`Item enqueued to workerToMainQueue successfully.`)
        } else {
          log(`Failed to enqueue Item to workerToMainQueue.`)
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
