function isTestEnv() {
  return process.env.NODE_ENV === 'test'
}

function isDevEnv() {
  return process.env.NODE_ENV === 'development'
}

function isProdEnv() {
  return process.env.NODE_ENV === 'production'
}

function getServerVersion() {
  return process.env.SPECKLE_SERVER_VERSION || 'dev'
}

function isApolloMonitoringEnabled() {
  return [true, 'true'].includes(process.env.APOLLO_SCHEMA_REPORTING)
}

function getApolloServerVersion() {
  return process.env.APOLLO_SERVER_USER_VERSION
}

module.exports = {
  isTestEnv,
  isDevEnv,
  isProdEnv,
  getServerVersion,
  isApolloMonitoringEnabled,
  getApolloServerVersion
}
