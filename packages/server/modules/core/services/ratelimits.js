'use strict'
const knex = require('@/db/knex')

const RatelimitActions = () => knex('ratelimit_actions')
const prometheusClient = require('prom-client')

const limitsReached = new prometheusClient.Counter({
  name: 'speckle_server_blocked_ratelimit',
  help: 'Number of time the requests were blocked',
  labelNames: ['actionName']
})

const LIMITS = {
  // rate limits:
  USER_CREATE: parseInt(process.env.RATELIMIT_USER_CREATE) || 1000, // per week
  STREAM_CREATE: parseInt(process.env.RATELIMIT_STREAM_CREATE) || 10000, // per week (1 stream / minute average)
  COMMIT_CREATE: parseInt(process.env.RATELIMIT_COMMIT_CREATE) || 86400, // per day (1 commit every second average)
  // unused:
  SUBSCRIPTION: parseInt(process.env.RATELIMIT_SUBSCRIPTION) || 600, // per minute
  REST_API: parseInt(process.env.RATELIMIT_REST_API) || 2400, // per minute
  WEBHOOKS: parseInt(process.env.RATELIMIT_WEBHOOKS) || 1000, // per day
  PREVIEWS: parseInt(process.env.RATELIMIT_PREVIEWS) || 1000, // per day
  FILE_UPLOADS: parseInt(process.env.RATELIMIT_FILE_UPLOADS) || 1000, // per day
  // static limits:
  BRANCHES: parseInt(process.env.LIMIT_BRANCHES) || 1000, // per stream
  TOKENS: parseInt(process.env.LIMIT_TOKENS) || 1000, // per user
  ACTIVE_SUBSCRIPTIONS: parseInt(process.env.LIMIT_ACTIVE_SUBSCRIPTIONS) || 100, // per user
  ACTIVE_CONNECTIONS: parseInt(process.env.LIMIT_ACTIVE_CONNECTIONS) || 100, // per source ip

  'POST /api/getobjects/:streamId': 200, // for 1 minute
  'POST /api/diff/:streamId': 200, // for 1 minute
  'POST /objects/:streamId': 200, // for 1 minute
  'GET /objects/:streamId/:objectId': 200, // for 1 minute
  'GET /objects/:streamId/:objectId/single': 200 // for 1 minute
}

const LIMIT_INTERVAL = {
  // rate limits
  USER_CREATE: 7 * 24 * 3600,
  STREAM_CREATE: 7 * 24 * 3600,
  COMMIT_CREATE: 24 * 3600,
  SUBSCRIPTION: 60,
  REST_API: 60,
  WEBHOOKS: 24 * 3600,
  PREVIEWS: 24 * 3600,
  FILE_UPLOADS: 24 * 3600,
  // static limits:
  BRANCHES: 0,
  TOKENS: 0,
  ACTIVE_SUBSCRIPTIONS: 0,
  ACTIVE_CONNECTIONS: 0,

  'POST /api/getobjects/:streamId': 60,
  'POST /api/diff/:streamId': 60,
  'POST /objects/:streamId': 60,
  'GET /objects/:streamId/:objectId': 60,
  'GET /objects/:streamId/:objectId/single': 60
}

const rateLimitedCache = {}

async function shouldRateLimitNext({ action, source }) {
  if (!source) return false

  const limit = LIMITS[action]
  const checkInterval = LIMIT_INTERVAL[action]
  if (limit === undefined || checkInterval === undefined) {
    return false
  }

  let startTimeMs
  if (checkInterval === 0) startTimeMs = 0
  else startTimeMs = Date.now() - checkInterval * 1000

  const [res] = await RatelimitActions()
    .count()
    .where({ action, source })
    .andWhere('timestamp', '>', new Date(startTimeMs))
  const count = parseInt(res.count) + 1 // plus this request

  const shouldRateLimit = count >= limit

  if (!shouldRateLimit) {
    await RatelimitActions().insert({ action, source })
  }
  return shouldRateLimit
}

// returns true if the action is fine, false if it should be blocked because of exceeding limit
async function respectsLimits({ action, source }) {
  const rateLimitKey = `${action} ${source}`
  const promise = shouldRateLimitNext({ action, source }).then((shouldRateLimit) => {
    if (shouldRateLimit) rateLimitedCache[rateLimitKey] = true
    else delete rateLimitedCache[rateLimitKey]
  })
  if (rateLimitedCache[rateLimitKey]) {
    await promise
  }

  if (rateLimitedCache[rateLimitKey]) limitsReached.labels(action).inc()
  return !rateLimitedCache[rateLimitKey]
}

async function rejectsRequestWithRatelimitStatusIfNeeded({ action, req, res }) {
  const source = req.context.userId || req.context.ip
  if (!(await respectsLimits({ action, source })))
    return res.status(429).set('X-Speckle-Meditation', 'https://http.cat/429').send({
      err: 'You are sending too many requests. You have been rate limited. Please try again later.'
    })
}
module.exports = {
  LIMITS,
  LIMIT_INTERVAL,
  respectsLimits,
  rejectsRequestWithRatelimitStatusIfNeeded
}
