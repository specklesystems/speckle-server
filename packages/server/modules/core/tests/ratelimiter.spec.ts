/* istanbul ignore file */
import { TIME } from '@speckle/shared'
import {
  createRateLimiterMiddleware,
  getRateLimitResult,
  isRateLimitBreached,
  getActionForPath,
  sendRateLimitResponse,
  RateLimitBreached,
  RateLimits,
  createConsumer,
  RateLimiterMapping,
  allActions,
  RateLimitAction
} from '@/modules/core/services/ratelimiter'
import { expect } from 'chai'
import httpMocks from 'node-mocks-http'
import { RateLimiterMemory } from 'rate-limiter-flexible'

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

const createTestRateLimiterMappings = () => {
  const mapping = Object.fromEntries(
    allActions.map((action) => {
      return [action, { limitCount: 0, duration: 1 * TIME.week }]
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
      const rateLimiterMapping = createTestRateLimiterMappings()
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
    it('should return 429 and set appropriate headers', async () => {
      const breached: RateLimitBreached = {
        isWithinLimits: false,
        action: 'POST /graphql',
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

      const action = 'POST /graphql'
      const testMappings = createTestRateLimiterMappings()
      const limit = 100
      testMappings[action] = createConsumer(
        action,
        new RateLimiterMemory({
          keyPrefix: action,
          points: limit,
          duration: 1 * TIME.week
        })
      )

      const SUT = createRateLimiterMiddleware(testMappings)

      await temporarilyDisableTestEnv(async () => {
        await SUT(request, response, next)
      })

      expect(nextCalled).to.equal(1)
      expect(response.getHeader('X-RateLimit-Remaining')).to.equal(limit - 1)
    })

    it('should return 429 if rate limited', async () => {
      const request = httpMocks.createRequest({
        path: '/graphql',
        method: 'POST',
        ip: generateRandomIP()
      })

      let response = httpMocks.createResponse()
      let nextCalled = 0
      const next = () => {
        nextCalled++
      }

      const SUT = createRateLimiterMiddleware(createTestRateLimiterMappings())
      response = httpMocks.createResponse()

      await temporarilyDisableTestEnv(async () => {
        await SUT(request, response, next)
      })

      expect(nextCalled).to.equal(0)
      assert429response(response)
    })
  })
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const temporarilyDisableTestEnv = async (callback: () => Promise<any>) => {
  const oldNodeEnv = process.env.NODE_ENV
  process.env.NODE_ENV = 'temporarily-disabled-test'
  await callback()
  process.env.NODE_ENV = oldNodeEnv
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const assert429response = (response: any) => {
  expect(response.getHeader('X-RateLimit-Remaining')).to.be.undefined
  expect(response.getHeader('Retry-After')).to.be.greaterThanOrEqual(4)
  expect(response.getHeader('X-RateLimit-Reset')).to.not.be.undefined
  expect(response.statusCode).to.equal(429)
}
