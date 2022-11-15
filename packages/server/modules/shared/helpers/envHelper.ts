import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { trimEnd } from 'lodash'

export function isTestEnv() {
  return process.env.NODE_ENV === 'test'
}

export function isDevEnv() {
  return process.env.NODE_ENV === 'development'
}

export function isProdEnv() {
  return process.env.NODE_ENV === 'production'
}

export function getServerVersion() {
  return process.env.SPECKLE_SERVER_VERSION || 'dev'
}

export function isApolloMonitoringEnabled() {
  return [true, 'true'].includes(process.env.APOLLO_SCHEMA_REPORTING || false)
}

export function getApolloServerVersion() {
  return process.env.APOLLO_SERVER_USER_VERSION
}

export function getFileSizeLimitMB() {
  return parseInt(process.env.FILE_SIZE_LIMIT_MB || '100')
}

export function getRedisUrl() {
  if (!process.env.REDIS_URL) {
    throw new MisconfiguredEnvironmentError('REDIS_URL env var not configured')
  }

  return process.env.REDIS_URL
}

/**
 * Get app base url / canonical url / origin
 */
export function getBaseUrl() {
  if (!process.env.CANONICAL_URL) {
    throw new MisconfiguredEnvironmentError('CANONICAL_URL env var not configured')
  }

  return trimEnd(process.env.CANONICAL_URL, '/')
}

/**
 * Whether notification job consumption & handling should be disabled
 */
export function shouldDisableNotificationsConsumption() {
  return ['1', 'true'].includes(
    process.env.DISABLE_NOTIFICATIONS_CONSUMPTION || 'false'
  )
}

/**
 * Check whether we're running an SSL server
 */
export function isSSLServer() {
  return /^https:\/\//.test(getBaseUrl())
}
