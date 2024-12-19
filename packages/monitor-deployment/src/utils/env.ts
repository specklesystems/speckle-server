export function getIntFromEnv(envVarKey: string, aDefault = '0'): number {
  return parseInt(process.env[envVarKey] || aDefault)
}
function getBooleanFromEnv(envVarKey: string, aDefault = false): boolean {
  return ['1', 'true', true].includes(
    process.env[envVarKey]?.toLocaleLowerCase() || aDefault.toString()
  )
}

export const getMetricsHost = () => process.env['METRICS_HOST'] || '127.0.0.1'
export const getLogLevel = () => process.env['LOG_LEVEL'] || 'info'
export const getMetricsPort = () => process.env['PROMETHEUS_METRICS_PORT'] || '9092'
export const getNodeEnv = () => process.env['NODE_ENV'] || 'production'
export const getPostgresConnectionString = () =>
  process.env['PG_CONNECTION_STRING'] || 'postgres://speckle:speckle@127.0.0.1/speckle'
export const getPostgresCACertificate = () => process.env['POSTGRES_CA_CERTIFICATE']
export const getPostgresMaxConnections = () =>
  getIntFromEnv('POSTGRES_MAX_CONNECTIONS_DATABASE_MONITOR', '2')
export const getConnectionAcquireTimeoutMillis = () =>
  getIntFromEnv('POSTGRES_CONNECTION_ACQUIRE_TIMEOUT_MILLIS', '16000')
export const getConnectionCreateTimeoutMillis = () =>
  getIntFromEnv('POSTGRES_CONNECTION_CREATE_TIMEOUT_MILLIS', '5000')
export function databaseMonitorCollectionPeriodSeconds() {
  return getIntFromEnv('METRICS_COLLECTION_PERIOD_SECONDS', '120')
}
export const getDatabaseName = () => process.env['POSTGRES_DATABASE']

export const isDevelopment = () =>
  getNodeEnv() === 'development' || getNodeEnv() === 'dev'
export const isLogPretty = () => getBooleanFromEnv('LOG_PRETTY', false)
export const isProduction = () => getNodeEnv() === 'production'
export const isTest = () => getNodeEnv() === 'test'
export const isDevOrTestEnv = () => isDevelopment() || isTest()
