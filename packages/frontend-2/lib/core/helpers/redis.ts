import { Redis } from 'ioredis'
import type pino from 'pino'

export const createRedis = async (params: { logger: pino.Logger }) => {
  const { logger } = params
  const { redisUrl } = useRuntimeConfig()
  if (!redisUrl?.length) {
    return undefined
  }

  const redis = new Redis(redisUrl)

  redis.on('error', (err) => {
    logger.error(err, 'Redis error')
  })

  redis.on('end', () => {
    logger.debug('Redis disconnected from server')
  })

  // Try to ping the server
  const res = await redis.ping()
  if (res !== 'PONG') {
    throw new Error('Redis server did not respond to ping')
  }

  return redis
}
