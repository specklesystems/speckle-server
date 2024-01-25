import { Redis } from 'ioredis'

/**
 * Re-using the same client for all SSR reqs (shouldn't be a problem)
 */
let redis: InstanceType<typeof Redis> | undefined = undefined

/**
 * Provide redis (only in SSR)
 */
export default defineNuxtPlugin(async () => {
  const { redisUrl } = useRuntimeConfig()
  const logger = useLogger()

  try {
    const hasValidStatus =
      redis && ['ready', 'connecting', 'reconnecting'].includes(redis.status)
    if (!redis || !hasValidStatus) {
      if (redis) {
        await redis.quit()
      }

      redis = new Redis(redisUrl)

      redis.on('error', (err) => {
        logger.error(err, 'Redis error')
      })

      redis.on('end', () => {
        logger.info('Redis disconnected from server')
      })
    }
  } catch (e) {
    logger.error(e, 'Redis setup failure')
  }

  const isValid = redis && redis.status === 'ready'
  return {
    provide: {
      redis: isValid ? redis : undefined
    }
  }
})
