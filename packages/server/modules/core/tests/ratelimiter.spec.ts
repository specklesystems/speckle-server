/* istanbul ignore file */
import { TIME } from '@speckle/shared'
import {
  getRateLimitResult,
  isRateLimitBreached,
  getActionForPath,
  RateLimitBreached,
  RateLimits,
  createConsumer,
  RateLimiterMapping,
  allActions,
  RateLimitAction,
  throwIfRateLimited
} from '@/modules/core/services/ratelimiter'
import { expect } from 'chai'
import httpMocks from 'node-mocks-http'
import { RateLimiterMemory } from 'rate-limiter-flexible'
import {
  addRateLimitHeadersToResponse,
  createRateLimiterMiddleware
} from '@/modules/core/rest/ratelimiter'
import { RateLimitError } from '@/modules/core/errors/ratelimit'
import { expectToThrow } from '@/test/assertionHelper'

type RateLimiterOptions = {
  [key in RateLimitAction]: RateLimits
}

const initializeInMemoryRateLimiters = (
  options: RateLimiterOptions
): RateLimiterMapping => {
  const mapping = Object.fromEntries(
    allActions.map((action) => {
      const limits = options[action]
      const limiter = new RateLimiterMemory({
        keyPrefix: action,
        points: limits.limitCount,
        duration: limits.duration
      })

      return [action, createConsumer(action, limiter)]
    })
  )
  return mapping as RateLimiterMapping
}

const createTestRateLimiterFailingMappings = () => {
  const mapping = Object.fromEntries(
    allActions.map((action) => {
      return [action, { limitCount: 0, duration: 1 * TIME.week }]
    })
  )
  const rateLimiterOptions = mapping as RateLimiterOptions
  return initializeInMemoryRateLimiters(rateLimiterOptions)
}

const PASSING_RATE_LIMIT_COUNT = 10_000
const createTestRateLimiterPassingMappings = () => {
  const mapping = Object.fromEntries(
    allActions.map((action) => {
      return [action, { limitCount: PASSING_RATE_LIMIT_COUNT, duration: 1 * TIME.week }]
    })
  )
  const rateLimiterOptions = mapping as RateLimiterOptions
  return initializeInMemoryRateLimiters(rateLimiterOptions)
}

const generateRandomIP = () => {
  return `${Math.floor(Math.random() * 255) + 1}.${Math.floor(
    Math.random() * 255
  )}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
}

describe('Rate Limiting', () => {
  describe('isRateLimitBreached', () => {
    it('should rate limit known actions', async () => {
      const rateLimiterMapping = createTestRateLimiterFailingMappings()
      const result = await getRateLimitResult(
        'STREAM_CREATE',
        generateRandomIP(),
        rateLimiterMapping
      )

      expect(isRateLimitBreached(result)).to.be.true
      expect(result.action).to.equal('STREAM_CREATE')
    })
  })

  describe('getActionForPath', () => {
    it('should rate limit unknown path as all request action', async () => {
      expect(getActionForPath('/graphql', 'POST')).to.equal('POST /graphql')
      expect(getActionForPath('/graphql', 'PATCH')).to.equal('ALL_REQUESTS')
      expect(getActionForPath('/foobar', 'GET')).to.equal('ALL_REQUESTS')
      expect(getActionForPath('/auth/local/login', 'POST')).to.equal(
        '/auth/local/login'
      )
      expect(getActionForPath('/auth/local/login', 'GET')).to.equal('/auth/local/login')
    })
  })

  describe('sendRateLimitResponse', () => {
    it('should set appropriate headers', async () => {
      const breached: RateLimitBreached = {
        isWithinLimits: false,
        action: 'POST /graphql',
        msBeforeNext: 4900
      }
      const response = httpMocks.createResponse()
      addRateLimitHeadersToResponse(response, breached)
      assertRateLimiterHeadersResponse(response)
    })
  })

  //FIXME the tests in this describe block cannot be run in parallel
  //      with other tests as it modifies process.env
  describe('rateLimiterMiddleware', () => {
    it('should set header with remaining points if not rate limited', async () => {
      const request = httpMocks.createRequest({
        path: '/graphql',
        method: 'POST'
      })
      const response = httpMocks.createResponse()
      let nextCalled = 0
      const next = () => {
        nextCalled++
      }

      const testMappings = createTestRateLimiterPassingMappings()

      const SUT = createRateLimiterMiddleware({ rateLimiterMapping: testMappings })

      await temporarilyEnableRateLimiter(async () => {
        await SUT(request, response, next)
      })

      expect(nextCalled).to.equal(1)
      expect(response.getHeader('X-RateLimit-Remaining')).to.equal(
        PASSING_RATE_LIMIT_COUNT - 1
      )
    })

    it('should set relevant headers if rate limited', async () => {
      const request = httpMocks.createRequest({
        path: '/graphql',
        method: 'POST',
        ip: generateRandomIP()
      })

      let response = httpMocks.createResponse()
      let nextCalledWithErr = 0
      let nextCalledWithoutErr = 0
      const next = (err: unknown) => {
        if (err) {
          nextCalledWithErr++
        } else {
          nextCalledWithoutErr++
        }
        expect(err).to.not.be.undefined
        expect(err).to.have.property('rateLimitBreached')
      }

      const SUT = createRateLimiterMiddleware({
        rateLimiterMapping: createTestRateLimiterFailingMappings()
      })
      response = httpMocks.createResponse()

      await temporarilyEnableRateLimiter(async () => {
        const e = await expectToThrow(async () => await SUT(request, response, next))
        expect(e).to.be.instanceOf(RateLimitError)
      })

      // next should be called as it instead throws an error
      expect(nextCalledWithErr).to.equal(0)
      expect(nextCalledWithoutErr).to.equal(0)
      assertRateLimiterHeadersResponse(response)
    })
  })

  describe('throwIfRateLimited', () => {
    it('returns null if rate limiter is not enabled', async () => {
      const result = await throwIfRateLimited({
        rateLimiterEnabled: false,
        action: 'POST /graphql',
        source: 'some-source'
      })
      expect(result).to.be.null
    })
    it('returns rate limit success if rate limit is not breached', async () => {
      const result = await throwIfRateLimited({
        rateLimiterEnabled: true,
        rateLimiterMapping: createTestRateLimiterPassingMappings(),
        action: 'POST /graphql',
        source: 'some-source'
      })
      expect(result).to.not.be.null
      expect(result?.remainingPoints).to.equal(PASSING_RATE_LIMIT_COUNT - 1)
    })
    it('throws RateLimitError if rate limit is breached', async () => {
      let handlerCalled = 0
      let result: RateLimitBreached | null = null
      const e = await expectToThrow(
        async () =>
          await throwIfRateLimited({
            rateLimiterEnabled: true,
            rateLimiterMapping: createTestRateLimiterFailingMappings(),
            action: 'POST /graphql',
            handleRateLimitBreachPriorToThrowing: (rateLimitResult) => {
              handlerCalled++
              result = rateLimitResult
            },
            source: 'some-source'
          })
      )
      expect(e).to.be.instanceOf(
        RateLimitError,
        'Rate limit should have been breached and thrown a RateLimitError'
      )
      expect(handlerCalled).to.equal(1)
      expect(result).to.not.be.null
    })
  })
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const temporarilyEnableRateLimiter = async (callback: () => Promise<any>) => {
  const oldRateLimiterEnabledFlag = process.env.RATELIMITER_ENABLED
  process.env.RATELIMITER_ENABLED = 'true'
  try {
    await callback()
  } finally {
    process.env.RATELIMITER_ENABLED = oldRateLimiterEnabledFlag
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const assertRateLimiterHeadersResponse = (response: any) => {
  expect(response.getHeader('X-RateLimit-Remaining')).to.be.undefined
  expect(response.getHeader('Retry-After')).to.be.greaterThanOrEqual(4)
  expect(response.getHeader('X-RateLimit-Reset')).to.not.be.undefined
  // expect(response.statusCode).to.equal(429) // response status code is added by the error handler, which is not part of this integration test
}
