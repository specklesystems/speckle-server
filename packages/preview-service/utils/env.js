const getAppPort = () => process.env.PORT || '3001'
const getChromiumExecutablePath = () =>
  process.env.CHROMIUM_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable'
const getHost = () => process.env.HOST || '127.0.0.1'
const getLogLevel = () => process.env.LOG_LEVEL || 'info'
const getMetricsPort = () => Number(process.env.PROMETHEUS_METRICS_PORT) || 9094
const getNodeEnv = () => process.env.NODE_ENV || 'production'
const getPostgresConnectionString = () =>
  process.env.PG_CONNECTION_STRING || 'postgres://speckle:speckle@127.0.0.1/speckle'
const getPuppeteerUserDataDir = () => process.env.USER_DATA_DIR || '/tmp/puppeteer'
const isDevelopment = () => getNodeEnv() === 'development'
const isLogPretty = () => process.env.LOG_PRETTY === 'true'
const isProduction = () => getNodeEnv() === 'production'
const isTest = () => getNodeEnv() === 'test'
const serviceUrl = () => `http://${getHost()}:${getAppPort()}`
const shouldBeHeadless = () => process.env.PREVIEWS_HEADED !== 'true'

module.exports = {
  getAppPort,
  getChromiumExecutablePath,
  getHost,
  getLogLevel,
  getMetricsPort,
  getNodeEnv,
  getPostgresConnectionString,
  getPuppeteerUserDataDir,
  isDevelopment,
  isLogPretty,
  isProduction,
  isTest,
  serviceUrl,
  shouldBeHeadless
}
