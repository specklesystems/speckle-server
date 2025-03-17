import { expect } from 'chai'
import { isRedisAlive } from '@/healthchecks/redis'
import { getInmemoryRedisClient } from '@/test/redisHelper'
import Redis from 'ioredis'

describe('Healthchecks @healthchecks', () => {
  describe('Redis health check @redis', () => {
    describe('isRedisAlive', () => {
      it('should return true if the redis connection is alive', async () => {
        const client = getInmemoryRedisClient()
        const result = await isRedisAlive({ client })
        expect(result.isAlive).to.be.true
      })
      it('should return false if the redis connection is not alive', async () => {
        const result = await isRedisAlive({
          client: {
            ping: () => {
              return 'I am b0rkened'
            },
            quit: () => {}
          } as unknown as Redis
        })
        if (result.isAlive) {
          expect(result.isAlive).to.be.false
          throw new Error('Unexpected condition') // HACK to force correct typing
        }
        expect(result.err).to.be.an('error')
      })
    })
  })
})
