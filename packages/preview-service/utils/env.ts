export const getAppPort = () => process.env.PORT || '3001'
export const getChromiumExecutablePath = () =>
  process.env.CHROMIUM_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable'
export const getHealthCheckFilePath = () =>
  process.env.HEALTHCHECK_FILE_PATH || '/tmp/last_successful_query'
export const getHost = () => process.env.HOST || '127.0.0.1'
export const getLogLevel = () => process.env.LOG_LEVEL || 'info'
export const getMetricsPort = () => process.env.PROMETHEUS_METRICS_PORT || '9094'
export const getNodeEnv = () => process.env.NODE_ENV || 'production'
export const getPostgresConnectionString = () =>
  process.env.PG_CONNECTION_STRING || 'postgres://speckle:speckle@127.0.0.1/speckle'
export const getPuppeteerUserDataDir = () =>
  process.env.USER_DATA_DIR || '/tmp/puppeteer'
export const isDevelopment = () => getNodeEnv() === 'development'
export const isLogPretty = () => process.env.LOG_PRETTY?.toLocaleLowerCase() === 'true'
export const isProduction = () => getNodeEnv() === 'production'
export const isTest = () => getNodeEnv() === 'test'
export const serviceOrigin = () => `http://${getHost()}:${getAppPort()}`
export const shouldBeHeadless = () => process.env.PREVIEWS_HEADED !== 'true'
