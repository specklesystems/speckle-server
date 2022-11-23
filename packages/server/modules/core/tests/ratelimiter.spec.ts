/* istanbul ignore file */
import { TIME } from '@/../shared/dist-esm'
import {
  createRateLimiterMiddleware,
  getRateLimitResult,
  initializeRedisRateLimiters,
  isRateLimitBreached,
  LIMITS,
  RateLimitAction,
  getActionForPath,
  sendRateLimitResponse,
  RateLimitBreached
} from '@/modules/core/services/ratelimiter'
import { expect } from 'chai'
import httpMocks from 'node-mocks-http'

const createTestRateLimiterMappings = () => {
  const rateLimiterOptions = LIMITS
  rateLimiterOptions.STREAM_CREATE = {
    regularOptions: {
      limitCount: 1,
      duration: 5 * TIME.second
    },
    burstOptions: {
      limitCount: 1,
      duration: 5 * TIME.second
    }
  }
  rateLimiterOptions['POST /graphql'] = {
    regularOptions: {
      limitCount: 1,
      duration: 5 * TIME.second
    },
    burstOptions: {
      limitCount: 1,
      duration: 5 * TIME.second
    }
  }
  return initializeRedisRateLimiters(rateLimiterOptions)
}

describe('Rate Limiting', () => {
  describe('isRateLimitBreached', () => {
    it('should rate limit known actions', async () => {
      const rateLimiterMapping = createTestRateLimiterMappings()
      const source = '255.255.255.255'

      // first will exhaust limits of regular rate limiter
      // second will fall through to the burst rate limiter and exhaust its limits
      for (let i = 0; i < 2; i++) {
        const result = await getRateLimitResult(
          RateLimitAction.STREAM_CREATE,
          source,
          rateLimiterMapping
        )
        expect(isRateLimitBreached(result)).to.be.false
        expect(result.action).to.equal(RateLimitAction.STREAM_CREATE)
      }

      // third will fail on both regular and burst rate limiters
      const third = await getRateLimitResult(
        RateLimitAction.STREAM_CREATE,
        source,
        rateLimiterMapping
      )

      expect(isRateLimitBreached(third)).to.be.true
      expect(third.action).to.equal(RateLimitAction.STREAM_CREATE)
    })
  })

  describe('getActionForPath', () => {
    it('should rate limit unknown path as all request action', async () => {
      expect(getActionForPath('/graphql', 'POST')).to.equal(
        RateLimitAction['POST /graphql']
      )
      expect(getActionForPath('/graphql', 'PATCH')).to.equal(
        RateLimitAction.ALL_REQUESTS
      )
      expect(getActionForPath('/foobar', 'GET')).to.equal(RateLimitAction.ALL_REQUESTS)
    })
  })

  describe('sendRateLimitResponse', () => {
    it('should return 429 and set appropriate headers', async () => {
      const breached: RateLimitBreached = {
        isWithinLimits: false,
        action: RateLimitAction['POST /graphql'],
        msBeforeNext: 4900
      }
      const response = httpMocks.createResponse()
      await sendRateLimitResponse(response, breached)
      assert429response(response)
    })
  })

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

      await createRateLimiterMiddleware()(request, response, next)
      expect(nextCalled).to.equal(1)
      expect(response.getHeader('X-RateLimit-Remaining')).to.equal(49)
    })

    it('should return 429 if rate limited', async () => {
      const rateLimiterMapping = createTestRateLimiterMappings()
      const request = httpMocks.createRequest({
        path: '/graphql',
        method: 'POST',
        ip: '123.45.67.89' // unique IP for this test, to prevent pollution with other tests using POST /graphql
      })

      let response = httpMocks.createResponse()
      let nextCalled = 0
      const next = () => {
        nextCalled++
      }
      const SUT = createRateLimiterMiddleware(rateLimiterMapping)

      // two calls should be within normal and burst rate limit
      for (let i = 0; i < 2; i++) {
        response = httpMocks.createResponse()
        await SUT(request, response, next)
        expect(nextCalled).to.equal(i + 1)
      }

      // but third call should fail
      response = httpMocks.createResponse()
      await SUT(request, response, next)

      expect(nextCalled).to.equal(2)
      assert429response(response)
    })
  })
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const assert429response = (response: any) => {
  expect(response.getHeader('X-RateLimit-Remaining')).to.be.undefined
  expect(response.getHeader('Retry-After')).to.be.greaterThanOrEqual(4)
  expect(response.getHeader('X-RateLimit-Reset')).to.not.be.undefined
  expect(response.statusCode).to.equal(429)
}
