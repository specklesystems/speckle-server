function isTestEnv() {
  return process.env.NODE_ENV === 'test'
}

function isDevEnv() {
  return process.env.NODE_ENV === 'development'
}

function isProdEnv() {
  return process.env.NODE_ENV === 'production'
}

module.exports = { isTestEnv, isDevEnv, isProdEnv }
