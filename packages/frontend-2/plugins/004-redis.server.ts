import { Redis } from 'ioredis'

/**
 * Re-using the same client for all SSR reqs (shouldn't be a problem)
 */
let redis: InstanceType<typeof Redis> | undefined = undefined

/**
 * Provide redis (only in SSR)
 */
export default defineNuxtPlugin(() => {
  const { redisUrl } = useRuntimeConfig()
  if (!redis) {
    redis = redisUrl?.length ? new Redis(redisUrl) : undefined
  }

  return {
    provide: {
      redis
    }
  }
})
