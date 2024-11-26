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

export const isDevOrTestEnv = () => isDevEnv() || isTestEnv()

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
  return ['1', 'true', true].includes(process.env[envVarKey] || aDefault.toString())
}

export function getStringFromEnv(
  envVarKey: string,
  options?: Partial<{
    /**
     * If set to true, wont throw if the env var is not set
     */
    unsafe: boolean
  }>
): string {
  const envVar = process.env[envVarKey]
  if (!envVar) {
    if (options?.unsafe) return ''
    throw new MisconfiguredEnvironmentError(`${envVarKey} env var not configured`)
  }
  return envVar
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
  return getStringFromEnv('REDIS_URL')
}

export function getOidcDiscoveryUrl() {
  return getStringFromEnv('OIDC_DISCOVERY_URL')
}

export function getOidcClientId() {
  return getStringFromEnv('OIDC_CLIENT_ID')
}

export function getOidcClientSecret() {
  return getStringFromEnv('OIDC_CLIENT_SECRET')
}

export function getOidcName() {
  return getStringFromEnv('OIDC_NAME')
}

export function getGoogleClientId() {
  return getStringFromEnv('GOOGLE_CLIENT_ID')
}

export function getGoogleClientSecret() {
  return getStringFromEnv('GOOGLE_CLIENT_SECRET')
}

export function getGithubClientId() {
  return getStringFromEnv('GITHUB_CLIENT_ID')
}

export function getGithubClientSecret() {
  return getStringFromEnv('GITHUB_CLIENT_SECRET')
}

export function getAzureAdIdentityMetadata() {
  return getStringFromEnv('AZURE_AD_IDENTITY_METADATA')
}

export function getAzureAdClientId() {
  return getStringFromEnv('AZURE_AD_CLIENT_ID')
}

export function getAzureAdIssuer() {
  return process.env.AZURE_AD_ISSUER || undefined
}

export function getAzureAdClientSecret() {
  return process.env.AZURE_AD_CLIENT_SECRET || undefined
}

export function getMailchimpStatus() {
  return getBooleanFromEnv('MAILCHIMP_ENABLED', false)
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

export function getBindAddress(aDefault: string = '127.0.0.1') {
  return process.env.BIND_ADDRESS || aDefault
}

export function getPort() {
  return getIntFromEnv('PORT', '3000')
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
  return getStringFromEnv('EMAIL_FROM')
}

export function getMaximumProjectModelsPerPage() {
  return getIntFromEnv('MAX_PROJECT_MODELS_PER_PAGE', '500')
}

export function delayGraphqlResponsesBy() {
  if (!isDevEnv()) return 0
  return getIntFromEnv('DELAY_GQL_RESPONSES_BY', '0')
}

export function getAutomateEncryptionKeysPath() {
  return getStringFromEnv('AUTOMATE_ENCRYPTION_KEYS_PATH')
}

export function getGendoAIKey() {
  return getStringFromEnv('GENDOAI_KEY')
}

export function getGendoAICreditLimit() {
  return getIntFromEnv('GENDOAI_CREDIT_LIMIT')
}

export function getGendoAiApiEndpoint() {
  return getStringFromEnv('GENDOAI_API_ENDPOINT')
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
  return getStringFromEnv('S3_ACCESS_KEY')
}

export function getS3SecretKey() {
  return getStringFromEnv('S3_SECRET_KEY')
}

export function getS3Endpoint() {
  return getStringFromEnv('S3_ENDPOINT')
}

export function getS3Region(aDefault: string = 'us-east-1') {
  return process.env.S3_REGION || aDefault
}

export function getS3BucketName() {
  return getStringFromEnv('S3_BUCKET')
}

export function createS3Bucket() {
  return getBooleanFromEnv('S3_CREATE_BUCKET')
}

export function getStripeApiKey(): string {
  return getStringFromEnv('STRIPE_API_KEY')
}

export function getStripeEndpointSigningKey(): string {
  return getStringFromEnv('STRIPE_ENDPOINT_SIGNING_KEY')
}

export function getOtelTracingUrl() {
  return getStringFromEnv('OTEL_TRACE_URL')
}

export function getOtelTraceKey() {
  return getStringFromEnv('OTEL_TRACE_KEY')
}

export function getOtelHeaderValue() {
  return getStringFromEnv('OTEL_TRACE_VALUE')
}

export function getMultiRegionConfigPath(options?: Partial<{ unsafe: boolean }>) {
  return getStringFromEnv('MULTI_REGION_CONFIG_PATH', options)
}

export const shouldRunTestsInMultiregionMode = () =>
  getBooleanFromEnv('RUN_TESTS_IN_MULTIREGION_MODE')

export function shutdownTimeoutSeconds() {
  return getIntFromEnv('SHUTDOWN_TIMEOUT_SECONDS', '300')
}
