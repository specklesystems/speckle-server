import type { Redis } from 'ioredis'
import { createRedis } from '~/lib/core/helpers/redis'

/**
 * Re-using the same client for all SSR reqs (shouldn't be a problem)
 */
let redis: InstanceType<typeof Redis> | undefined = undefined

/**
 * Provide redis (only in SSR)
 */
export default defineNuxtPlugin(async () => {
  const logger = useLogger()

  try {
    const hasValidStatus =
      redis && ['ready', 'connecting', 'reconnecting'].includes(redis.status)
    if (!redis || !hasValidStatus) {
      if (redis) {
        await redis.quit()
      }

      redis = await createRedis({ logger })
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
