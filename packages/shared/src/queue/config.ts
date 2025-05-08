import Bull from 'bull'
import { Redis } from 'ioredis'
import { isRedisReady } from '../redis/isRedisReady.js'

// we're caching this here, so that there is one client for the app lifecycle

type ClientCache = Record<string, { client?: Redis; subscriber?: Redis }>

const clientCache: ClientCache = {}

export const initializeQueue = async <T>({
  queueName,
  redisUrl,
  options
}: {
  queueName: string
  redisUrl: string
  options?: Partial<Bull.QueueOptions>
}): Promise<Bull.Queue<T>> => {
  if (!(redisUrl in clientCache)) clientCache[redisUrl] = {}
  const opts: Bull.QueueOptions = {
    ...options,
    // redisOpts here will contain at least a property of connectionName which will identify the queue based on its name
    createClient(type, redisOpts) {
      switch (type) {
        case 'client':
          if (redisUrl in clientCache && clientCache[redisUrl].client !== undefined) {
            return clientCache[redisUrl].client
          } else {
            const client = new Redis(redisUrl, redisOpts ?? {})
            clientCache[redisUrl].client = client
            return client
          }
        case 'subscriber':
          if (
            redisUrl in clientCache &&
            clientCache[redisUrl].subscriber !== undefined
          ) {
            return clientCache[redisUrl].subscriber
          } else {
            const subscriber = new Redis(redisUrl, {
              ...redisOpts,
              maxRetriesPerRequest: null,
              enableReadyCheck: false
            })
            clientCache[redisUrl].subscriber = subscriber
            return subscriber
          }
        case 'bclient':
          return new Redis(redisUrl, {
            ...redisOpts,
            maxRetriesPerRequest: null,
            enableReadyCheck: false
          })
        default:
          throw new Error(`Unexpected connection type: ${type}`)
      }
    }
  }
  const newQueue = new Bull<T>(queueName, opts)
  // bull does not check if redis is ready...
  //
  // logger.info('Checking Redis connection is ready...')
  if (!clientCache[redisUrl].client)
    throw new Error('Redis client not properly initialized')
  await isRedisReady(clientCache[redisUrl].client)
  // await isRedisReady(clientCache[redisUrl].subscriber)
  return await newQueue.isReady()
}
