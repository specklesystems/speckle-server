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
  ACTIVE_CONNECTIONS: parseInt(process.env.LIMIT_ACTIVE_CONNECTIONS) || 100 // per source ip
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
  ACTIVE_CONNECTIONS: 0
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

module.exports = {
  LIMITS,
  LIMIT_INTERVAL,

  // returns true if the action is fine, false if it should be blocked because of exceeding limit
  async respectsLimits({ action, source }) {
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
}
