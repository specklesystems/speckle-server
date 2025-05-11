import { Redis } from 'ioredis'
import { ensureError } from '../core/helpers/error.js'

// MIT Licensed: https://github.com/OptimalBits/bull/blob/develop/LICENSE.md
// Reference: https://github.com/OptimalBits/bull/blob/develop/lib/utils.js
export const isRedisReady = (client: Redis) => {
  return new Promise<void>((resolve, reject) => {
    if (client.status === 'ready') {
      resolve()
    } else {
      function handleReady() {
        client.removeListener('end', handleEnd)
        client.removeListener('error', handleError)
        resolve()
      }

      function handleError(e: unknown) {
        const err = ensureError(e, 'Unknown error in Redis client')
        client.removeListener('ready', handleReady)
        client.removeListener('error', handleError)
        reject(err)
      }

      function handleEnd() {
        client.removeListener('ready', handleReady)
        client.removeListener('error', handleError)
        reject(new Error('Redis connection ended'))
      }

      client.once('ready', handleReady)
      client.on('error', handleError)
      client.once('end', handleEnd)
    }
  })
}
