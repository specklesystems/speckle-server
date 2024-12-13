export function getIntFromEnv(envVarKey: string, aDefault = '0'): number {
  return parseInt(process.env[envVarKey] || aDefault)
}

export const getMetricsHost = () => process.env.METRICS_HOST || '127.0.0.1'
export const getLogLevel = () => process.env.LOG_LEVEL || 'info'
export const getMetricsPort = () => process.env.PROMETHEUS_METRICS_PORT || '9092'
export const getNodeEnv = () => process.env.NODE_ENV || 'production'
export const getPostgresConnectionString = () =>
  process.env.PG_CONNECTION_STRING || 'postgres://speckle:speckle@127.0.0.1/speckle'
export const getPostgresMaxConnections = () =>
  parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '2')
export function databaseMonitorCollectionPeriodSeconds() {
  return getIntFromEnv('METRICS_COLLECTION_PERIOD_SECONDS', '120')
}
export const getDatabaseName = () => process.env.POSTGRES_DATABASE

export const isDevelopment = () =>
  getNodeEnv() === 'development' || getNodeEnv() === 'dev'
export const isLogPretty = () => process.env.LOG_PRETTY?.toLocaleLowerCase() === 'true'
export const isProduction = () => getNodeEnv() === 'production'
export const isTest = () => getNodeEnv() === 'test'
export const isDevOrTestEnv = () => isDevelopment() || isTest()
