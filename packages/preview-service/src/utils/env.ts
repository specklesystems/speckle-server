function getIntFromEnv(envVarKey: string, aDefault = '0'): number {
  return parseInt(process.env[envVarKey] || aDefault)
}
function getBooleanFromEnv(envVarKey: string, aDefault = false): boolean {
  return ['1', 'true', true].includes(process.env[envVarKey] || aDefault.toString())
}

export const getAppPort = () => process.env['PORT'] || '3001'
export const getChromiumExecutablePath = () => {
  if (isDevelopment()) return undefined // use default
  return process.env['CHROMIUM_EXECUTABLE_PATH'] || '/usr/bin/google-chrome-stable'
}
export const getHealthCheckFilePath = () =>
  process.env['HEALTHCHECK_FILE_PATH'] || '/tmp/last_successful_query'
export const getHost = () => process.env['HOST'] || '127.0.0.1'
export const getMetricsHost = () => process.env['METRICS_HOST'] || '127.0.0.1'
export const getLogLevel = () => process.env['LOG_LEVEL'] || 'info'
export const getMetricsPort = () => process.env['PROMETHEUS_METRICS_PORT'] || '9094'
export const getNodeEnv = () => process.env['NODE_ENV'] || 'production'
export const getPostgresConnectionString = () =>
  process.env['PG_CONNECTION_STRING'] || 'postgres://speckle:speckle@127.0.0.1/speckle'
export const getPostgresMaxConnections = () =>
  getIntFromEnv('POSTGRES_MAX_CONNECTIONS_PREVIEW_SERVICE', '2')
export const getConnectionAcquireTimeoutMillis = () =>
  getIntFromEnv('POSTGRES_CONNECTION_ACQUIRE_TIMEOUT_MILLIS', '16000')
export const getConnectionCreateTimeoutMillis = () =>
  getIntFromEnv('POSTGRES_CONNECTION_CREATE_TIMEOUT_MILLIS', '5000')
export const getPreviewTimeout = () => getIntFromEnv('PREVIEW_TIMEOUT', '3600000')
export const getPuppeteerUserDataDir = () => {
  if (isDevelopment()) return undefined // use default
  return process.env['USER_DATA_DIR'] || '/tmp/puppeteer'
}
export const isDevelopment = () =>
  getNodeEnv() === 'development' || getNodeEnv() === 'dev'
export const isLogPretty = () => getBooleanFromEnv('LOG_PRETTY')
export const isProduction = () => getNodeEnv() === 'production'
export const isTest = () => getNodeEnv() === 'test'
export const isDevOrTestEnv = () => isDevelopment() || isTest()
export const serviceOrigin = () => `http://${getHost()}:${getAppPort()}`
export const shouldBeHeadless = () => !getBooleanFromEnv('PREVIEWS_HEADED')
