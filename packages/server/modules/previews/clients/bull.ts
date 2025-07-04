import { Queue, type Job } from 'bull'
import type { EventEmitter } from 'stream'
import { initializeQueue } from '@speckle/shared/queue'
import { JobPayload } from '@speckle/shared/workers/previews'
import {
  DelayBetweenPreviewRetriesMinutes,
  NumberOfPreviewRetries
} from '@/modules/previews/domain/consts'
import { TIME, TIME_MS } from '@speckle/shared'
import { getPreviewServiceTimeoutMilliseconds } from '@/modules/shared/helpers/envHelper'

interface QueueEventEmitter extends EventEmitter {}

const defaultJobOptions = {
  attempts: NumberOfPreviewRetries,
  timeout:
    NumberOfPreviewRetries *
    (getPreviewServiceTimeoutMilliseconds() +
      DelayBetweenPreviewRetriesMinutes * TIME_MS.minute),
  backoff: {
    type: 'fixed',
    delay: DelayBetweenPreviewRetriesMinutes * TIME_MS.minute
  },
  removeOnComplete: {
    // retain completed jobs for 1 day or until it is the 100th completed job being retained, whichever comes first
    age: 1 * TIME.day,
    count: 100
  },
  removeOnFail: {
    // retain completed jobs for 1 week or until it is the 1_000th failed job being retained, whichever comes first
    age: 1 * TIME.week,
    count: 1_000
  }
}

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

  // The error event is triggered when an error in the Redis backend is thrown.
  requestQueue.removeListener('error', requestErrorHandler)
  requestQueue.on('error', requestErrorHandler)

  // The failed event is triggered when a job fails by throwing an exception during execution.
  // https://api.docs.bullmq.io/interfaces/v5.QueueEventsListener.html#failed
  requestQueue.removeListener('failed', requestFailedHandler)
  requestQueue.on('failed', requestFailedHandler)

  requestQueue.removeListener('active', requestActiveHandler)
  requestQueue.on('active', requestActiveHandler)
}

export const createRequestQueue = async (params: {
  redisUrl: string
  requestQueueName: string
  requestErrorHandler: (err: Error) => void
  requestFailedHandler: (job: Job, err: Error) => void
  requestActiveHandler: (job: Job) => void
}): Promise<Queue<JobPayload>> => {
  const {
    redisUrl,
    requestQueueName,
    requestErrorHandler,
    requestActiveHandler,
    requestFailedHandler
  } = params

  const previewRequestQueue = await initializeQueue<JobPayload>({
    queueName: requestQueueName,
    redisUrl,
    options: {
      defaultJobOptions
    }
  })

  addRequestQueueListeners({
    requestQueue: previewRequestQueue,
    requestErrorHandler,
    requestFailedHandler,
    requestActiveHandler
  })

  return previewRequestQueue
}
