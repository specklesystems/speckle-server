import { getRedisUrl } from '@/modules/shared/helpers/envHelper'
import { createRedisClient } from '@/modules/shared/redis/redis'
import Bull from 'bull'

export function buildBaseQueueOptions(): Bull.QueueOptions {
  return {
    createClient: (type) => {
      const client = createRedisClient(getRedisUrl(), {
        ...(['bclient', 'subscriber'].includes(type)
          ? {
              enableReadyCheck: false,
              maxRetriesPerRequest: null
            }
          : {})
      })

      return client
    }
  }
}
