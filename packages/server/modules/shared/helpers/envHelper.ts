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

export function getMaximumObjectSizeMB() {
  return getIntFromEnv('MAX_OBJECT_SIZE_MB', '10')
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

export function getOidcDiscoveryUrl() {
  if (!process.env.OIDC_DISCOVERY_URL) {
    throw new MisconfiguredEnvironmentError('OIDC_DISCOVERY_URL env var not configured')
  }

  return process.env.OIDC_DISCOVERY_URL
}

export function getOidcClientId() {
  if (!process.env.OIDC_CLIENT_ID) {
    throw new MisconfiguredEnvironmentError('OIDC_CLIENT_ID env var not configured')
  }

  return process.env.OIDC_CLIENT_ID
}

export function getOidcClientSecret() {
  if (!process.env.OIDC_CLIENT_SECRET) {
    throw new MisconfiguredEnvironmentError('OIDC_CLIENT_SECRET env var not configured')
  }

  return process.env.OIDC_CLIENT_SECRET
}

export function getOidcName() {
  if (!process.env.OIDC_NAME) {
    throw new MisconfiguredEnvironmentError('OIDC_NAME env var not configured')
  }

  return process.env.OIDC_NAME
}

export function getMailchimpStatus() {
  return [true, 'true'].includes(process.env.MAILCHIMP_ENABLED || false)
}

export function getMailchimpConfig() {
  if (
    !process.env.MAILCHIMP_API_KEY ||
    !process.env.MAILCHIMP_SERVER_PREFIX ||
    !process.env.MAILCHIMP_LIST_ID
  ) {
    throw new MisconfiguredEnvironmentError('Mailchimp is not configured')
  }

  return {
    apiKey: process.env.MAILCHIMP_API_KEY,
    serverPrefix: process.env.MAILCHIMP_SERVER_PREFIX,
    listId: process.env.MAILCHIMP_LIST_ID
  }
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

export function adminOverrideEnabled() {
  return process.env.ADMIN_OVERRIDE_ENABLED === 'true'
}

export function enableMixpanel() {
  // if not explicitly set to '0' or 'false', it is enabled by default
  return !['0', 'false'].includes(process.env.ENABLE_MP || 'true')
}

export function speckleAutomateUrl() {
  const automateUrl =
    process.env.SPECKLE_AUTOMATE_URL || 'https://automate.speckle.systems'
  return automateUrl
}

/**
 * Useful in some CLI scenarios when you aren't doing anything with the DB
 */
export function ignoreMissingMigrations() {
  return ['1', 'true'].includes(process.env.IGNORE_MISSING_MIRATIONS || 'false')
}
