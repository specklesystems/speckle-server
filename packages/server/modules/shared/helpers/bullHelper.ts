import Redis from 'ioredis'
import Bull from 'bull'
import { getRedisUrl } from '@/modules/shared/helpers/envHelper'

export function buildBaseQueueOptions(): Bull.QueueOptions {
  return {
    createClient: (type) => {
      // @see https://github.com/OptimalBits/bull/issues/1873
      const client = new Redis(getRedisUrl(), {
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
