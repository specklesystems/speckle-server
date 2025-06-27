import { Queue, type Job } from 'bull'
import type { EventEmitter } from 'stream'
import { initializeQueue } from '@speckle/shared/queue'
import { JobPayload, PreviewResultPayload } from '@speckle/shared/workers/previews'

interface QueueEventEmitter extends EventEmitter {}

export const addRequestQueueListeners = (params: {
  requestQueue: QueueEventEmitter
  requestErrorHandler: (err: Error) => void
  requestFailedHandler: (job: Job, err: Error) => void
  requestActiveHandler: (job: Job) => void
}) => {
  const {
    requestQueue,
    requestErrorHandler,
    requestFailedHandler,
    requestActiveHandler
  } = params

  requestQueue.removeListener('error', requestErrorHandler)
  requestQueue.on('error', requestErrorHandler)

  requestQueue.removeListener('failed', requestFailedHandler)
  requestQueue.on('failed', requestFailedHandler)

  requestQueue.removeListener('active', requestActiveHandler)
  requestQueue.on('active', requestActiveHandler)
}

export const createRequestAndResponseQueues = async (params: {
  redisUrl: string
  requestQueueName: string
  responseQueueName: string
  requestErrorHandler: (err: Error) => void
  requestFailedHandler: (job: Job, err: Error) => void
  requestActiveHandler: (job: Job) => void
}): Promise<{
  requestQueue: Queue<JobPayload>
  responseQueue: Queue<PreviewResultPayload>
}> => {
  const {
    redisUrl,
    requestQueueName,
    responseQueueName,
    requestErrorHandler,
    requestActiveHandler,
    requestFailedHandler
  } = params

  const previewRequestQueue = await initializeQueue<JobPayload>({
    queueName: requestQueueName,
    redisUrl
  })

  addRequestQueueListeners({
    requestQueue: previewRequestQueue,
    requestErrorHandler,
    requestFailedHandler,
    requestActiveHandler
  })

  const previewResponseQueue = await initializeQueue<PreviewResultPayload>({
    queueName: responseQueueName,
    redisUrl
  })

  return { requestQueue: previewRequestQueue, responseQueue: previewResponseQueue }
}
