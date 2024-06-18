import { ensureError } from '@speckle/shared'
import { createRedis } from '~/lib/core/helpers/redis'

/**
 * Check that the deployment is fine
 */

export default defineEventHandler(async () => {
  let redisConnected = false

  // Check that redis works
  try {
    const redis = await createRedis({ logger: useLogger() })
    redisConnected = !!redis
    if (redis) {
      await redis.quit()
    }
  } catch (e) {
    const errMsg = ensureError(e).message
    throw createError({
      statusCode: 500,
      fatal: true,
      message: `Redis connection failed: ${errMsg}`
    })
  }

  return { status: 'ok', redisConnected }
})
