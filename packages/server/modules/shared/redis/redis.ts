import { redisLogger } from '@/observability/logging'
import Redis, { RedisOptions } from 'ioredis'
import {
  EnvironmentResourceError,
  MisconfiguredEnvironmentError
} from '@/modules/shared/errors'
import { getRedisUrl } from '@/modules/shared/helpers/envHelper'
import { ensureError } from '@speckle/shared'

export function createRedisClient(redisUrl: string, redisOptions: RedisOptions): Redis {
  let redisClient: Redis
  try {
    redisClient = new Redis(redisUrl, redisOptions)
    redisClient.on('error', (err) => {
      redisLogger.error(err, 'Redis encountered an error.')
      if (err instanceof Error) {
        throw new EnvironmentResourceError('Redis encountered an error.', err) //FIXME backoff and retry?
      }
      throw new EnvironmentResourceError('Redis encountered an error.') //FIXME backoff and retry?
    })
  } catch (err) {
    redisLogger.error(err, 'Could not create Redis client')
    if (err instanceof Error) {
      throw new MisconfiguredEnvironmentError('Unable to connect to Redis.', err) //FIXME backoff and retry?
    }
    throw new MisconfiguredEnvironmentError('Unable to connect to Redis.') //FIXME backoff and retry?
  }

  return redisClient
}

let redisClient: Redis | undefined = undefined

export const getGenericRedis = (): Redis => {
  if (!redisClient) redisClient = createRedisClient(getRedisUrl(), {})
  return redisClient
}

export const isRedisReady = (client: Redis) => {
  // MIT Licensed: https://github.com/OptimalBits/bull/blob/develop/LICENSE.md
  // Reference: https://github.com/OptimalBits/bull/blob/develop/lib/utils.js
  return new Promise<void>((resolve, reject) => {
    if (client.status === 'ready') {
      resolve()
    } else {
      function handleReady() {
        client.removeListener('end', handleEnd)
        client.removeListener('error', handleError)
        resolve()
      }

      function handleError(e: unknown) {
        const err = ensureError(e, 'Unknown error in Redis client')
        client.removeListener('ready', handleReady)
        client.removeListener('error', handleError)
        reject(err)
      }

      function handleEnd() {
        client.removeListener('ready', handleReady)
        client.removeListener('error', handleError)
        reject(new Error('Redis connection ended'))
      }

      client.once('ready', handleReady)
      client.on('error', handleError)
      client.once('end', handleEnd)
    }
  })
}
