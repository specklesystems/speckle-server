import { expect } from 'chai'
import { isRedisAlive } from '@/healthchecks/redis'
import { createInmemoryRedisClient } from '@/test/redisHelper'
import Redis from 'ioredis'

describe('Healthchecks @healthchecks', () => {
  describe('Redis health check @redis', () => {
    describe('isRedisAlive', () => {
      it('should return true if the redis connection is alive', async () => {
        const client = createInmemoryRedisClient()
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
        //TODO temporarily skip this test until we have a way to simulate a redis connection failure (toxiproxy or passing Redis connection details to an invalid server)
        if (result.isAlive) {
          expect(result.isAlive).to.be.false
          throw new Error('Unexpected condition') // HACK to force correct typing
        }
        expect(result.err).to.be.an('error')
      })
    })
  })
})
