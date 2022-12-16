import { Nullable } from '@speckle/shared'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { trimEnd } from 'lodash'

/**
 * Whether the server is supposed to serve frontend 2.0
 */
export function useNewFrontend() {
  return ['1', 'true'].includes(process.env.USE_FRONTEND_2 || 'false')
}

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
  return getIntFromEnv('FILE_SIZE_LIMIT_MB', '100')
}

export function getIntFromEnv(envVarKey: string, aDefault = '0'): number {
  return parseInt(process.env[envVarKey] || aDefault)
}

export function getRedisUrl() {
  if (!process.env.REDIS_URL) {
    throw new MisconfiguredEnvironmentError('REDIS_URL env var not configured')
  }

  return process.env.REDIS_URL
}

/**
 * Get app base url / canonical url / origin
 * TODO: Go over all getBaseUrl() usages and move them to getXOrigin() instead
 * @deprecated Since the new FE both apps (Server & FE) have different base urls, so use `getFrontendOrigin()` or `getServerOrigin()` instead
 */
export function getBaseUrl() {
  return getServerOrigin()
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
 * Get frontend app origin/base URL
 */
export function getFrontendOrigin() {
  const envKey = useNewFrontend() ? 'FRONTEND_ORIGIN' : 'CANONICAL_URL'
  const trimmedOrigin = trimEnd(process.env[envKey], '/')

  if (!trimmedOrigin) {
    throw new MisconfiguredEnvironmentError(
      `Frontend origin env var (${envKey}) not configured!`
    )
  }

  return trimmedOrigin
}

/**
 * Get server app origin/base URL
 */
export function getServerOrigin() {
  if (!process.env.CANONICAL_URL) {
    throw new MisconfiguredEnvironmentError(
      'Server origin env var (CANONICAL_URL) not configured'
    )
  }

  return trimEnd(process.env.CANONICAL_URL, '/')
}

/**
 * Check whether we're running an SSL server
 */
export function isSSLServer() {
  return /^https:\/\//.test(getBaseUrl())
}

/**
 * Source stream for cloning tutorial/guide streams for users
 */
export function getOnboardingStreamId(): Nullable<string> {
  return process.env.ONBOARDING_STREAM_ID || null
}
