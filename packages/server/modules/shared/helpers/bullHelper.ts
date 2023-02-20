import Redis from 'ioredis'
import Bull from 'bull'
import { getRedisUrl } from '@/modules/shared/helpers/envHelper'

export function buildBaseQueueOptions(): Bull.QueueOptions {
  return {
    createClient: (type) => {
      let client: Redis
      try {
        // @see https://github.com/OptimalBits/bull/issues/1873
        client = new Redis(getRedisUrl(), {
          ...(['bclient', 'subscriber'].includes(type)
            ? {
                enableReadyCheck: false,
                maxRetriesPerRequest: null
              }
            : {})
        })
        client.on('error', (err) => {
          throw new Error(`Unable to connect to Redis. ${err.message}`)
        })
      } catch (e) {
        if (e instanceof Error) {
          throw new Error(
            `Unable to connect to Redis. Please check your REDIS_URL environment variable. ${e.message}`
          )
        }
        throw new Error(
          'Unable to connect to Redis. Please check your REDIS_URL environment variable.'
        )
      }

      return client
    }
  }
}
