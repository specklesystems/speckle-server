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
  return getIntFromEnv('FILE_SIZE_LIMIT_MB', '100')
}

export function getMaximumObjectSizeMB() {
  return getIntFromEnv('MAX_OBJECT_SIZE_MB', '10')
}

export function getIntFromEnv(envVarKey: string, aDefault = '0'): number {
  return parseInt(process.env[envVarKey] || aDefault)
}

export function getBooleanFromEnv(envVarKey: string, aDefault = false): boolean {
  return ['1', 'true'].includes(process.env[envVarKey] || aDefault.toString())
}

/**
 * Whether the server is supposed to serve frontend 2.0
 */
export function useNewFrontend() {
  return getBooleanFromEnv('USE_FRONTEND_2')
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
  return getBooleanFromEnv('DISABLE_NOTIFICATIONS_CONSUMPTION')
}

/**
 * Get frontend app origin/base URL
 */
export function getFrontendOrigin(forceFe2?: boolean) {
  const envKey = useNewFrontend() || forceFe2 ? 'FRONTEND_ORIGIN' : 'CANONICAL_URL'
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
      'Server origin environment variable (CANONICAL_URL) not configured'
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

export function adminOverrideEnabled() {
  return process.env.ADMIN_OVERRIDE_ENABLED === 'true'
}

export function enableMixpanel() {
  if (isDevEnv() || isTestEnv()) return false

  // if not explicitly set to '0' or 'false', it is enabled by default
  return !['0', 'false'].includes(process.env.ENABLE_MP || 'true')
}

export function speckleAutomateUrl() {
  const automateUrl =
    process.env.SPECKLE_AUTOMATE_URL || 'https://automate.speckle.systems'
  return automateUrl
}

export function weeklyEmailDigestEnabled() {
  return process.env.WEEKLY_DIGEST_ENABLED === 'true'
}

/**
 * Useful in some CLI scenarios when you aren't doing anything with the DB
 */
export function ignoreMissingMigrations() {
  return getBooleanFromEnv('IGNORE_MISSING_MIRATIONS')
}

/**
 * URL of a project on any FE2 speckle server that will be pulled in and used as the onboarding stream
 */
export function getOnboardingStreamUrl() {
  const val = process.env.ONBOARDING_STREAM_URL
  if (!val?.length) return null

  try {
    // validating that the URL is valid
    return new URL(val).toString()
  } catch (e) {
    // suppress
  }

  return null
}

/**
 * Increase this value to re-sync the onboarding stream
 */
export function getOnboardingStreamCacheBustNumber() {
  const val = process.env.ONBOARDING_STREAM_CACHE_BUST_NUMBER || '1'
  return parseInt(val) || 1
}

export function getEmailFromAddress() {
  if (!process.env.EMAIL_FROM) {
    throw new MisconfiguredEnvironmentError(
      'Email From environment variable (EMAIL_FROM) is not configured'
    )
  }
  return process.env.EMAIL_FROM
}

export function getMaximumProjectModelsPerPage() {
  return getIntFromEnv('MAX_PROJECT_MODELS_PER_PAGE', '500')
}
