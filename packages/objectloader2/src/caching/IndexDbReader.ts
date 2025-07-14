import { RingBufferQueue } from '../workers/RingBufferQueue.js'
import { StringQueue } from './StringQueue.js'
import { ItemQueue } from './ItemQueue.js'
import { handleError, WorkerMessageType } from '../workers/WorkerMessageType.js'
import { InitQueuesMessage } from '../workers/InitQueuesMessage.js'
import IndexedDatabase from '../core/stages/indexedDatabase.js'
import { Item } from '../types/types.js'
import { isWhitespaceOnly } from '../types/functions.js'
import { RingBuffer } from '../workers/RingBuffer.js'
import BatchingQueue from '../queues/batchingQueue.js';

let workerToMainQueue: ItemQueue | null = null
let mainToWorkerQueue: StringQueue | null = null
let batchingQueue: BatchingQueue<string> | null = null
let db: IndexedDatabase | null = null

const consolePrefix = '[Worker]'

function log(message: string, ...args: unknown[]): void {
  console.log(`${consolePrefix} ${message}`, ...args)
}

function postMessage(args: unknown): void {
  ;(self as unknown as Worker).postMessage(args)
}

 const processBatch =
  async (batch: string[]): Promise<void> => {
     const start = performance.now()
     const items = await db?.getAll(batch) ?? []
     const processedItems: Item[] = []
     for (let i = 0; i < items.length; i++) {
       const item = items[i]
       if (item) {
         processedItems.push(item)
       } else {
         if (isWhitespaceOnly(batch[i])) {
           log('Received a whitespace-only message, skipping it.')
           continue
         }
         processedItems.push({ baseId: batch[i] })
       }
     }
     log(`Processed ${processedItems.length} items in ${performance.now() - start}ms`)
     // eslint-disable-next-line @typescript-eslint/no-floating-promises
     workerToMainQueue?.fullyEnqueue(
       processedItems,
       RingBuffer.DEFAULT_ENQUEUE_TIMEOUT_MS
     )
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
  db = new IndexedDatabase({})
  batchingQueue = new BatchingQueue<string>(
    {
              batchSize: RingBuffer.DEFAULT_ENQUEUE_SIZE,
        maxWaitTime:   RingBuffer.DEFAULT_ENQUEUE_TIMEOUT_MS,
        processFunction: processBatch

    });
  log('Starting to listen for messages from main thread...')
  while (true) {
    try {
      const receivedMessages = await mainToWorkerQueue.dequeue(
        RingBuffer.DEFAULT_ENQUEUE_SIZE,
        RingBuffer.DEFAULT_ENQUEUE_TIMEOUT_MS
      ) // receivedMessages will be string[]
      if (receivedMessages && receivedMessages.length > 0) {
        batchingQueue.addAll(receivedMessages, receivedMessages)
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
        data.mainToWorkerCapacityBytes,
        'StringQueue MainToWorkerQueue'
      )
      mainToWorkerQueue = new StringQueue(rawMainToWorkerRbq)
      log('StringQueue (main-to-worker) initialized successfully.')

      const rawWorkerToMainRbq = RingBufferQueue.fromExisting(
        data.workerToMainSab,
        data.workerToMainCapacityBytes,
        'ItemQueue WorkerToMainQueue'
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
