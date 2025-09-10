import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { has, trimEnd } from 'lodash-es'
import * as Environment from '@speckle/shared/environment'
import type { Nullable } from '@speckle/shared'
import { ensureError } from '@speckle/shared'

export function getStringFromEnv(
  envVarKey: string,
  options?: Partial<{
    /**
     * If set to true, wont throw if the env var is not set
     */
    unsafe: boolean
    /**
     * If set, will return this value if the env var is not set
     * Takes preceden
     */
    default?: string
  }>
): string {
  const envVar = process.env[envVarKey]
  if (!envVar) {
    if (options?.default) return options.default
    if (options?.unsafe) return ''
    throw new MisconfiguredEnvironmentError(`${envVarKey} env var not configured`)
  }
  return envVar
}

export function getIntFromEnv(envVarKey: string, aDefault = '0'): number {
  return parseInt(process.env[envVarKey] || aDefault)
}

export function getBooleanFromEnv(envVarKey: string, aDefault = false): boolean {
  if (!has(process.env, envVarKey)) {
    return aDefault
  }

  return ['1', 'true', true].includes(process.env[envVarKey] || 'false')
}

function mustGetUrlFromEnv(name: string, trimTrailingSlash: boolean = false): URL {
  const url = getUrlFromEnv(name, trimTrailingSlash)
  if (!url) throw new MisconfiguredEnvironmentError(`${name} env var not configured`)
  return url
}

function getUrlFromEnv(
  name: string,
  trimTrailingSlash: boolean = false
): Nullable<URL> {
  const value = process.env[name]
  if (!value) {
    return null
  }
  try {
    return new URL(trimTrailingSlash ? trimEnd(value, '/') : value)
  } catch (e: unknown) {
    const err = ensureError(e, 'Unknown error parsing URL')
    if (err instanceof TypeError && err.message === 'Invalid URL')
      throw new MisconfiguredEnvironmentError(`${name} has to be a valid URL`, {
        cause: err
      })
    throw new MisconfiguredEnvironmentError(`Error parsing ${name} URL`, { cause: err })
  }
}

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

export function isCompressionEnabled() {
  return getBooleanFromEnv('COMPRESSION')
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

// This is the time limit for file import jobs to parse the files, not the upload time limit; see FILE_UPLOAD_URL_EXPIRY_MINUTES
export function getFileImportTimeLimitMinutes() {
  return getIntFromEnv('FILE_IMPORT_TIME_LIMIT_MIN', '30')
}

export function getMaximumRequestBodySizeMB() {
  return getIntFromEnv('MAX_REQUEST_BODY_SIZE_MB', '100')
}

export function getMaximumObjectSizeMB() {
  return getIntFromEnv('MAX_OBJECT_SIZE_MB', '100')
}

export function enableNewFrontendMessaging() {
  return getBooleanFromEnv('ENABLE_FE2_MESSAGING')
}

export function getRedisUrl() {
  return getStringFromEnv('REDIS_URL')
}

export const previewServiceShouldUsePrivateObjectsServerUrl = (): boolean => {
  return getBooleanFromEnv('PREVIEW_SERVICE_USE_PRIVATE_OBJECTS_SERVER_URL')
}

export const fileImportServiceShouldUsePrivateObjectsServerUrl = (): boolean => {
  return getBooleanFromEnv('FILEIMPORT_SERVICE_USE_PRIVATE_OBJECTS_SERVER_URL')
}

export const getPreviewServiceRedisUrl = (): string | undefined => {
  return process.env['PREVIEW_SERVICE_REDIS_URL']
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
  if (!process.env.MAILCHIMP_ONBOARDING_LIST_ID)
    throw new MisconfiguredEnvironmentError('Mailchimp onboarding is not configured')
  return {
    listId: process.env.MAILCHIMP_ONBOARDING_LIST_ID
  }
}

export function getMailchimpNewsletterIds() {
  if (!process.env.MAILCHIMP_NEWSLETTER_LIST_ID)
    throw new MisconfiguredEnvironmentError('Mailchimp newsletter id is not configured')
  return { listId: process.env.MAILCHIMP_NEWSLETTER_LIST_ID }
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
export function getFrontendOrigin() {
  const trimmedOrigin = trimEnd(process.env['FRONTEND_ORIGIN'], '/')

  if (!trimmedOrigin) {
    throw new MisconfiguredEnvironmentError(
      `Frontend origin env var (FRONTEND_ORIGIN) not configured!`
    )
  }

  return trimmedOrigin
}

/**
 * Get server app origin/base URL.
 * This is the public server URL, i.e. 'canonical url', used for external communication.
 */
export function getServerOrigin() {
  return mustGetUrlFromEnv('CANONICAL_URL', true).origin
}

/**
 *
 * @returns the private server origin, which is used for internal communication between services
 */
export function getPrivateObjectsServerOrigin() {
  return mustGetUrlFromEnv('PRIVATE_OBJECTS_SERVER_URL', true).origin
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
  return /^https:\/\//.test(getServerOrigin())
}

export function getServerMovedFrom() {
  return getUrlFromEnv('MIGRATION_SERVER_MOVED_FROM')
}

export function getServerMovedTo() {
  return getUrlFromEnv('MIGRATION_SERVER_MOVED_TO')
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
  return getBooleanFromEnv('IGNORE_MISSING_MIGRATIONS')
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
  } catch {
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

export function getEncryptionKeysPath() {
  return getStringFromEnv('ENCRYPTION_KEYS_PATH')
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

export function getEmailTransporterType() {
  return getStringFromEnv('EMAIL_TRANSPORTER_TYPE', { unsafe: true, default: 'smtp' })
}

export const getFileImporterQueuePostgresUrl = () =>
  process.env['FILEIMPORT_QUEUE_POSTGRES_URL'] ?? null

export function postgresMaxConnections() {
  return getIntFromEnv('POSTGRES_MAX_CONNECTIONS_SERVER', '8')
}

export function postgresConnectionAcquireTimeoutMillis() {
  return getIntFromEnv('POSTGRES_CONNECTION_ACQUIRE_TIMEOUT_MILLIS', '16000')
}

export function postgresConnectionCreateTimeoutMillis() {
  return getIntFromEnv('POSTGRES_CONNECTION_CREATE_TIMEOUT_MILLIS', '5000')
}

export function highFrequencyMetricsCollectionPeriodMs() {
  return getIntFromEnv('HIGH_FREQUENCY_METRICS_COLLECTION_PERIOD_MS', '100')
}

export function maximumObjectUploadFileSizeMb() {
  return getIntFromEnv('MAX_OBJECT_UPLOAD_FILE_SIZE_MB', '100')
}

export function isFileUploadsEnabled() {
  // the env var should ideally be written as a positive
  // (e.g. ENABLE_FILE_UPLOADS),
  // but for legacy reasons is the negation.
  return !getBooleanFromEnv('DISABLE_FILE_UPLOADS', false)
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

export function getS3PublicEndpoint() {
  return getStringFromEnv('S3_PUBLIC_ENDPOINT', { unsafe: true })
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

export const knexAsyncStackTracesEnabled = () => {
  const envSet = process.env.KNEX_ASYNC_STACK_TRACES_ENABLED
  if (!envSet) return undefined
  return getBooleanFromEnv('KNEX_ASYNC_STACK_TRACES_ENABLED')
}

export const asyncRequestContextEnabled = () => {
  return getBooleanFromEnv('ASYNC_REQUEST_CONTEXT_ENABLED', isDevEnv())
}

export function enableImprovedKnexTelemetryStackTraces() {
  return getBooleanFromEnv('KNEX_IMPROVED_TELEMETRY_STACK_TRACES')
}

export function disablePreviews() {
  return getBooleanFromEnv('DISABLE_PREVIEWS')
}

export const isRateLimiterEnabled = (): boolean => {
  return getBooleanFromEnv('RATELIMITER_ENABLED', true)
}

export const getFileUploadUrlExpiryMinutes = (): number => {
  return getIntFromEnv('FILE_UPLOAD_URL_EXPIRY_MINUTES', '1440')
}

export const getPreviewServiceTimeoutMilliseconds = (): number => {
  return getIntFromEnv('PREVIEW_SERVICE_TIMEOUT_MILLISECONDS', '3600000') // 1 hour
}

export const getPreviewServiceRetryPeriodMinutes = (): number => {
  const value = getIntFromEnv('PREVIEW_SERVICE_RETRY_PERIOD_MINUTES', '1')
  if (value < 1 || value > 60)
    throw new MisconfiguredEnvironmentError(
      `PREVIEW_SERVICE_RETRY_PERIOD_MINUTES must be an integer between 1 and 60, got ${value}`
    )
  return value
}

export const getPreviewServiceMaxQueueBackpressure = (): number => {
  const value = getIntFromEnv('PREVIEW_SERVICE_MAX_QUEUE_BACKPRESSURE', '1')
  if (value < 1)
    throw new MisconfiguredEnvironmentError(
      `PREVIEW_SERVICE_MAX_QUEUE_BACKPRESSURE must be an integer greater than 0, got ${value}`
    )
  return value
}

export const emailVerificationTimeoutMinutes = (): number => {
  return getIntFromEnv('EMAIL_VERIFICATION_TIMEOUT_MINUTES', '5')
}

export function getAutodeskIntegrationClientId() {
  return getStringFromEnv('AUTODESK_INTEGRATION_CLIENT_ID')
}

export function getAutodeskIntegrationClientSecret() {
  return getStringFromEnv('AUTODESK_INTEGRATION_CLIENT_SECRET')
}

export const areSavedViewsEnabled = (): boolean =>
  getFeatureFlags().FF_SAVED_VIEWS_ENABLED
