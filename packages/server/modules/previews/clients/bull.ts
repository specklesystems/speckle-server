import Bull, { type Job, type QueueOptions } from 'bull'
import Redis, { type RedisOptions } from 'ioredis'
import { isRedisReady } from '@/modules/shared/redis/redis'
import type { EventEmitter } from 'stream'

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
}) => {
  const {
    redisUrl,
    requestQueueName: jobQueueName,
    responseQueueName,
    requestErrorHandler,
    requestFailedHandler,
    requestActiveHandler
  } = params
  let client: Redis
  let subscriber: Redis

  const opts: QueueOptions = {
    // redisOpts here will contain at least a property of connectionName which will identify the queue based on its name
    createClient(type: string, redisOpts: RedisOptions) {
      switch (type) {
        case 'client':
          if (!client) {
            client = new Redis(redisUrl, redisOpts)
          }
          return client
        case 'subscriber':
          if (!subscriber) {
            subscriber = new Redis(redisUrl, {
              ...redisOpts,
              maxRetriesPerRequest: null,
              enableReadyCheck: false
            })
          }
          return subscriber
        case 'bclient':
          return new Redis(redisUrl, {
            ...redisOpts,
            maxRetriesPerRequest: null,
            enableReadyCheck: false
          })
        default:
          throw new Error('Unexpected connection type: ' + type)
      }
    }
  }

  // previews are requested on this queue
  const requestQueue = new Bull(jobQueueName, opts)
  await isRedisReady(requestQueue.client)
  addRequestQueueListeners({
    requestQueue,
    requestErrorHandler,
    requestFailedHandler,
    requestActiveHandler
  })

  // rendered previews are sent back on this queue
  const responseQueue = new Bull(responseQueueName, opts)

  await isRedisReady(responseQueue.client)
  return { requestQueue, responseQueue }
}
