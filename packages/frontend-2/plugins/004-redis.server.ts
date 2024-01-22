import { Redis } from 'ioredis'

/**
 * Provide redis (only in SSR)
 */
export default defineNuxtPlugin(() => {
  const { redisUrl } = useRuntimeConfig()
  const redis = redisUrl?.length ? new Redis(redisUrl) : undefined

  return {
    provide: {
      redis
    }
  }
})
