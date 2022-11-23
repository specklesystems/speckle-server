/* istanbul ignore file */
import { TIME } from '@/../shared/dist-esm'
import {
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

describe('Rate Limiting', () => {
  describe('isRateLimitBreached', () => {
    before(async () => {
      return
    })

    it('should rate limit known actions', async () => {
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
      const rateLimiterMapping = initializeRedisRateLimiters(rateLimiterOptions)
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
      // TODO expect(false).to.be.true('')
    })
    it('should return 429 if rate limited', async () => {
      // TODO expect(false).to.be.true('')
    })
  })
})

const assert429response = (response: any) => {
  expect(response.getHeader('X-RateLimit-Remaining')).to.be.undefined
  expect(response.getHeader('Retry-After')).to.equal(4.9)
  expect(response.getHeader('X-RateLimit-Reset')).to.not.be.undefined
  expect(response.statusCode).to.equal(429)
}
