import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { trimEnd } from 'lodash'
import * as Environment from '@speckle/shared/dist/commonjs/environment/index.js'
import { ensureError } from '@speckle/shared'

export function getSessionSecret() {
  if (!process.env.SESSION_SECRET) {
    throw new MisconfiguredEnvironmentError('SESSION_SECRET env var not configured')
  }

  return process.env.SESSION_SECRET
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
  return getIntFromEnv('MAX_OBJECT_SIZE_MB', '100')
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

export function enableNewFrontendMessaging() {
  return getBooleanFromEnv('ENABLE_FE2_MESSAGING')
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

export function getGoogleClientId() {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new MisconfiguredEnvironmentError('GOOGLE_CLIENT_ID env var not configured')
  }

  return process.env.GOOGLE_CLIENT_ID
}

export function getGoogleClientSecret() {
  if (!process.env.GOOGLE_CLIENT_SECRET) {
    throw new MisconfiguredEnvironmentError(
      'GOOGLE_CLIENT_SECRET env var not configured'
    )
  }

  return process.env.GOOGLE_CLIENT_SECRET
}

export function getGithubClientId() {
  if (!process.env.GITHUB_CLIENT_ID) {
    throw new MisconfiguredEnvironmentError('GITHUB_CLIENT_ID env var not configured')
  }

  return process.env.GITHUB_CLIENT_ID
}

export function getGithubClientSecret() {
  if (!process.env.GITHUB_CLIENT_SECRET) {
    throw new MisconfiguredEnvironmentError(
      'GITHUB_CLIENT_SECRET env var not configured'
    )
  }

  return process.env.GITHUB_CLIENT_SECRET
}

export function getAzureAdIdentityMetadata() {
  if (!process.env.AZURE_AD_IDENTITY_METADATA) {
    throw new MisconfiguredEnvironmentError(
      'AZURE_AD_IDENTITY_METADATA env var not configured'
    )
  }

  return process.env.AZURE_AD_IDENTITY_METADATA
}

export function getAzureAdClientId() {
  if (!process.env.AZURE_AD_CLIENT_ID) {
    throw new MisconfiguredEnvironmentError('AZURE_AD_CLIENT_ID env var not configured')
  }

  return process.env.AZURE_AD_CLIENT_ID
}

export function getAzureAdIssuer() {
  return process.env.AZURE_AD_ISSUER || undefined
}

export function getAzureAdClientSecret() {
  return process.env.AZURE_AD_CLIENT_SECRET || undefined
}

export function getMailchimpStatus() {
  return [true, 'true'].includes(process.env.MAILCHIMP_ENABLED || false)
}

export function getMailchimpConfig() {
  if (!getMailchimpStatus()) return null
  if (!process.env.MAILCHIMP_API_KEY || !process.env.MAILCHIMP_SERVER_PREFIX)
    throw new MisconfiguredEnvironmentError('Mailchimp api is not configured')
  return {
    apiKey: process.env.MAILCHIMP_API_KEY,
    serverPrefix: process.env.MAILCHIMP_SERVER_PREFIX
  }
}

export function getMailchimpOnboardingIds() {
  if (
    !process.env.MAILCHIMP_ONBOARDING_LIST_ID ||
    !process.env.MAILCHIMP_ONBOARDING_JOURNEY_ID ||
    !process.env.MAILCHIMP_ONBOARDING_STEP_ID
  )
    throw new MisconfiguredEnvironmentError('Mailchimp onboarding is not configured')
  return {
    listId: process.env.MAILCHIMP_ONBOARDING_LIST_ID,
    journeyId: parseInt(process.env.MAILCHIMP_ONBOARDING_JOURNEY_ID),
    stepId: parseInt(process.env.MAILCHIMP_ONBOARDING_STEP_ID)
  }
}

export function getMailchimpNewsletterIds() {
  if (!process.env.MAILCHIMP_NEWSLETTER_LIST_ID)
    throw new MisconfiguredEnvironmentError('Mailchimp newsletter id is not configured')
  return { listId: process.env.MAILCHIMP_NEWSLETTER_LIST_ID }
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

  try {
    return new URL(trimEnd(process.env.CANONICAL_URL, '/')).origin
  } catch (e) {
    const err = ensureError(e)
    if (e instanceof TypeError && e.message === 'Invalid URL') {
      throw new MisconfiguredEnvironmentError(
        `Server origin environment variable (CANONICAL_URL) is not a valid URL: ${err.message}`,
        {
          cause: e,
          info: {
            value: process.env.CANONICAL_URL
          }
        }
      )
    }

    throw err
  }
}

/**
 * Check whether we're running an SSL server
 */
export function isSSLServer() {
  return /^https:\/\//.test(getBaseUrl())
}

function parseUrlVar(value: string, name: string) {
  try {
    return new URL(value)
  } catch (err: unknown) {
    if (err instanceof TypeError && err.message === 'Invalid URL')
      throw new MisconfiguredEnvironmentError(`${name} has to be a valid URL`)
    throw err
  }
}

export function getServerMovedFrom() {
  const value = process.env.MIGRATION_SERVER_MOVED_FROM
  if (!value) return value
  return parseUrlVar(value, 'MIGRATION_SERVER_MOVED_FROM')
}

export function getServerMovedTo() {
  const value = process.env.MIGRATION_SERVER_MOVED_TO
  if (!value) return value
  return parseUrlVar(value, 'MIGRATION_SERVER_MOVED_TO')
}

export function adminOverrideEnabled() {
  return getBooleanFromEnv('ADMIN_OVERRIDE_ENABLED')
}

export function enableMixpanel() {
  if (isDevEnv() || isTestEnv()) {
    // Check if explicitly enabled
    return getBooleanFromEnv('FORCE_ENABLE_MP')
  }

  // if not explicitly set to '0' or 'false', it is enabled by default
  return !['0', 'false'].includes(process.env.ENABLE_MP || 'true')
}

export function speckleAutomateUrl() {
  const automateUrl = process.env.SPECKLE_AUTOMATE_URL
  return automateUrl
}

export function weeklyEmailDigestEnabled() {
  return getBooleanFromEnv('WEEKLY_DIGEST_ENABLED')
}

/**
 * Useful in some CLI scenarios when you aren't doing anything with the DB
 */
export function ignoreMissingMigrations() {
  return getBooleanFromEnv('IGNORE_MISSING_MIRATIONS')
}

/**
 * Whether to enable GQL API mocks
 */
export const mockedApiModules = () => {
  const base = process.env.MOCKED_API_MODULES
  return (base || '').split(',').map((x) => x.trim())
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

export function delayGraphqlResponsesBy() {
  if (!isDevEnv()) return 0
  return getIntFromEnv('DELAY_GQL_RESPONSES_BY', '0')
}

export function getAutomateEncryptionKeysPath() {
  if (!process.env.AUTOMATE_ENCRYPTION_KEYS_PATH) {
    throw new MisconfiguredEnvironmentError(
      'Automate encryption keys path environment variable (AUTOMATE_ENCRYPTION_KEYS_PATH) is not configured'
    )
  }

  return process.env.AUTOMATE_ENCRYPTION_KEYS_PATH
}

export function getGendoAIKey() {
  return process.env.GENDOAI_KEY
}

export function getGendoAIResponseKey() {
  return process.env.GENDOAI_KEY_RESPONSE
}

export function getGendoAIAPIEndpoint() {
  return process.env.GENDOAI_API_ENDPOINT
}

export const getFeatureFlags = () => Environment.getFeatureFlags()

export function getLicenseToken(): string | undefined {
  return process.env.LICENSE_TOKEN
}

export function isEmailEnabled() {
  return getBooleanFromEnv('EMAIL')
}

export function postgresMaxConnections() {
  return getIntFromEnv('POSTGRES_MAX_CONNECTIONS_SERVER', '4')
}

export function highFrequencyMetricsCollectionPeriodMs() {
  return getIntFromEnv('HIGH_FREQUENCY_METRICS_COLLECTION_PERIOD_MS', '100')
}

export function maximumObjectUploadFileSizeMb() {
  return getIntFromEnv('MAX_OBJECT_UPLOAD_FILE_SIZE_MB', '100')
}

export function getS3AccessKey() {
  if (!process.env.S3_ACCESS_KEY)
    throw new MisconfiguredEnvironmentError(
      'Environment variable S3_ACCESS_KEY is missing'
    )
  return process.env.S3_ACCESS_KEY
}

export function getS3SecretKey() {
  if (!process.env.S3_SECRET_KEY)
    throw new MisconfiguredEnvironmentError(
      'Environment variable S3_SECRET_KEY is missing'
    )
  return process.env.S3_SECRET_KEY
}

export function getS3Endpoint() {
  if (!process.env.S3_ENDPOINT)
    throw new MisconfiguredEnvironmentError(
      'Environment variable S3_ENDPOINT is missing'
    )
  return process.env.S3_ENDPOINT
}

export function getS3Region(aDefault: string = 'us-east-1') {
  return process.env.S3_REGION || aDefault
}

export function getS3BucketName() {
  if (!process.env.S3_BUCKET)
    throw new MisconfiguredEnvironmentError('Environment variable S3_BUCKET is missing')
  return process.env.S3_BUCKET
}

export function createS3Bucket() {
  return getBooleanFromEnv('S3_CREATE_BUCKET')
}

export function getStripeApiKey(): string {
  if (!process.env.STRIPE_API_KEY)
    throw new MisconfiguredEnvironmentError(
      'Environment variable STRIPE_API_KEY is missing'
    )
  return process.env.STRIPE_API_KEY
}

export function getStripeEndpointSigningKey(): string {
  if (!process.env.STRIPE_ENDPOINT_SIGNING_KEY)
    throw new MisconfiguredEnvironmentError(
      'Environment variable STRIPE_ENDPOINT_SIGNING_KEY is missing'
    )
  return process.env.STRIPE_ENDPOINT_SIGNING_KEY
}

export function getWorkspaceGuestSeatStripePriceId(): string {
  if (!process.env.WORKSPACE_GUEST_SEAT_STRIPE_PRICE_ID)
    throw new MisconfiguredEnvironmentError(
      'Environment variable WORKSPACE_GUEST_SEAT_STRIPE_PRICE_ID is missing'
    )
  return process.env.WORKSPACE_GUEST_SEAT_STRIPE_PRICE_ID
}
export function getWorkspaceTeamSeatStripePriceId(): string {
  if (!process.env.WORKSPACE_TEAM_SEAT_STRIPE_PRICE_ID)
    throw new MisconfiguredEnvironmentError(
      'Environment variable WORKSPACE_TEAM_SEAT_STRIPE_PRICE_ID is missing'
    )
  return process.env.WORKSPACE_TEAM_SEAT_STRIPE_PRICE_ID
}

export function getWorkspaceProSeatStripePriceId(): string {
  if (!process.env.WORKSPACE_PRO_SEAT_STRIPE_PRICE_ID)
    throw new MisconfiguredEnvironmentError(
      'Environment variable WORKSPACE_PRO_SEAT_STRIPE_PRICE_ID is missing'
    )
  return process.env.WORKSPACE_PRO_SEAT_STRIPE_PRICE_ID
}
export function getWorkspaceBusinessSeatStripePriceId(): string {
  if (!process.env.WORKSPACE_BUSINESS_SEAT_STRIPE_PRICE_ID)
    throw new MisconfiguredEnvironmentError(
      'Environment variable WORKSPACE_BUSINESS_SEAT_STRIPE_PRICE_ID is missing'
    )
  return process.env.WORKSPACE_BUSINESS_SEAT_STRIPE_PRICE_ID
}
