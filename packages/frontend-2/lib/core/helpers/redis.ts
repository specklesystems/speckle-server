import type pino from 'pino'

export const createRedis = async (params: { logger: pino.Logger }) => {
  // invoke composables sync first
  const { redisUrl } = useRuntimeConfig()

  // doesnt work as a static import for some reason, maybe client build is picking it up
  const { default: Redis } = await import('ioredis')
  const { logger } = params
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
