import {
  CacheProvider,
  inMemoryCacheProviderFactory,
  redisCacheProviderFactory,
  wrapFactoryWithCache,
  wrapWithCache
} from '@/modules/shared/utils/caching'
import { describeEach } from '@/test/assertionHelper'
import TTLCache from '@isaacs/ttlcache'
import { wait } from '@speckle/shared'
import { expect } from 'chai'
import Redis from 'ioredis'
import MockRedis from 'ioredis-mock'

const argsKey = (...args: Array<unknown>) => JSON.stringify(args)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const actOnInvoke = <Args extends Array<any>, Result>(
  fn: (...args: Args) => Result,
  act: (...args: Args) => void
) => {
  return (...args: Args) => {
    act(...args)
    return fn(...args)
  }
}

const add = (a: number, b: number) => a + b
const subtract = (a: number, b: number) => a - b
const multiplyAddFactory =
  (deps: { add: typeof add }) => (a: number, b: number, times: number) =>
    deps.add(a, b) * times

describe('wrapWithCache', () => {
  describeEach(
    <const>[{ provider: 'redis' }, { provider: 'inmemory' }],
    ({ provider }) => `with ${provider} cache provider`,
    ({ provider }) => {
      let cacheProvider: CacheProvider
      let clearProvider: () => Promise<void>

      before(() => {
        if (provider === 'redis') {
          const mockRedis = new MockRedis()
          cacheProvider = redisCacheProviderFactory({
            redis: mockRedis as unknown as Redis
          })
          clearProvider = async () => {
            await mockRedis.flushall()
          }
        } else {
          const cache = new TTLCache<string, unknown>()
          cacheProvider = inMemoryCacheProviderFactory({ cache })
          clearProvider = async () => {
            cache.clear()
          }
        }
      })

      afterEach(async () => {
        await clearProvider()
      })

      it('should cache the result of a function', async () => {
        const invoked: Record<string, number> = {}

        const addCached = wrapWithCache({
          resolver: actOnInvoke(add, (...args) => {
            const key = argsKey(...args)
            invoked[key] = (invoked[key] || 0) + 1
          }),
          cacheProvider,
          name: 'add',
          ttlMs: 1000
        })

        const case1Args = <const>[1, 2]
        const case2Args = <const>[3, 4]

        const case1Result = await addCached(...case1Args)
        const case2Result = await addCached(...case2Args)
        const case1CachedResult = await addCached(...case1Args)
        const case2CachedResult = await addCached(...case2Args)

        expect(case1Result).to.equal(3)
        expect(case2Result).to.equal(7)

        expect(case1CachedResult).to.equal(case1Result)
        expect(case2CachedResult).to.equal(case2Result)

        expect(Object.keys(invoked)).to.have.lengthOf(2)
        expect(invoked[argsKey(...case1Args)]).to.equal(1)
        expect(invoked[argsKey(...case2Args)]).to.equal(1)
      })

      it('should allow skipping cached results', async () => {
        let invoked = 0

        const addCached = wrapWithCache({
          resolver: actOnInvoke(add, () => {
            invoked++
          }),
          cacheProvider,
          name: 'add',
          ttlMs: 1000
        })

        const args = <const>[5, 50]
        const res1 = await addCached(...args)
        const res2 = await addCached.fresh(...args)
        const res3 = await addCached(...args)

        expect(res1).to.equal(55)
        expect(res2).to.equal(55)
        expect(res3).to.equal(55)
        expect(invoked).to.equal(2)
      })

      it('should allow clearing cached results', async () => {
        let invoked = 0

        const addCached = wrapWithCache({
          resolver: actOnInvoke(add, () => {
            invoked++
          }),
          cacheProvider,
          name: 'add',
          ttlMs: 1000
        })

        const args = <const>[5, 50]
        const res1 = await addCached(...args)
        await addCached.clear(...args)
        const res2 = await addCached(...args)
        await addCached.clear(111, 222)
        const res3 = await addCached(...args)

        expect(res1).to.equal(55)
        expect(res2).to.equal(55)
        expect(res3).to.equal(55)
        expect(invoked).to.equal(2)
      })

      it('should follow ttl', async () => {
        let invoked = 0

        const addCached = wrapWithCache({
          resolver: actOnInvoke(add, () => {
            invoked++
          }),
          cacheProvider,
          name: 'add',
          ttlMs: 1
        })

        const args = <const>[3, 42]
        const res1 = await addCached(...args)
        await wait(1)
        const res2 = await addCached(...args)

        expect(res1).to.equal(45)
        expect(res2).to.equal(45)
        expect(invoked).to.equal(2)
      })

      describe('when caching a factory', () => {
        it('should allow caching factory results w/ different deps', async () => {
          const addInvoked: Record<string, number> = {}
          const subtractInvoked: Record<string, number> = {}

          const multiplyAddCachedFactory = wrapFactoryWithCache({
            name: 'multiplyAdd',
            factory: multiplyAddFactory,
            ttlMs: 1000,
            cacheProvider
          })

          const multiplyAddCached = multiplyAddCachedFactory({
            add: actOnInvoke(add, (...args) => {
              const key = argsKey(...args)
              addInvoked[key] = (addInvoked[key] || 0) + 1
            })
          })
          const multiplySubtractCached = multiplyAddCachedFactory(
            {
              add: actOnInvoke(subtract, (...args) => {
                const key = argsKey(...args)
                subtractInvoked[key] = (subtractInvoked[key] || 0) + 1
              })
            },
            {
              cacheKey: 'subtract'
            }
          )

          const args = <const>[1, 2, 3]
          const expectedAddResult = 9 // (1 + 2) * 3
          const expectedSubtractResult = -3 // (1 - 2) * 3

          const addRes1 = await multiplyAddCached(...args)
          const addRes2 = await multiplyAddCached(...args)
          const subtractRes1 = await multiplySubtractCached(...args)
          const subtractRes2 = await multiplySubtractCached(...args)

          expect(addRes1).to.equal(expectedAddResult)
          expect(addRes2).to.equal(expectedAddResult)
          expect(subtractRes1).to.equal(expectedSubtractResult)
          expect(subtractRes2).to.equal(expectedSubtractResult)

          expect(Object.keys(addInvoked)).to.have.lengthOf(1)
          expect(Object.keys(subtractInvoked)).to.have.lengthOf(1)

          // slice cause last arg goes to factory fn, not dep
          expect(addInvoked[argsKey(...args.slice(0, 2))]).to.equal(1)
          expect(subtractInvoked[argsKey(...args.slice(0, 2))]).to.equal(1)
        })
      })
    }
  )
})
