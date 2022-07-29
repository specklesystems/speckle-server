/* istanbul ignore file */
/**
 * Bootstrap module that should be imported at the very top of each entry point module
 */

// Initializing module aliases for absolute import paths
require('module-alias')({ base: __dirname })
const appRoot = __dirname

// Initializing env vars
const dotenv = require('dotenv')
const {
  isTestEnv,
  isApolloMonitoringEnabled,
  getApolloServerVersion,
  getServerVersion
} = require('./modules/shared/helpers/envHelper')

if (isApolloMonitoringEnabled() && !getApolloServerVersion()) {
  process.env.APOLLO_SERVER_USER_VERSION = getServerVersion()
}

// If running in test env, load .env.test first
// (appRoot necessary, cause env files aren't loaded through require() calls)
if (isTestEnv()) {
  const { error } = dotenv.config({ path: `${appRoot}/.env.test` })
  if (error) {
    const e = new Error(
      'Attempting to run tests without an .env.test file properly set up! Check readme!'
    )
    console.error(e)
    process.exit(1)
  }
}

dotenv.config({ path: `${appRoot}/.env` })

module.exports = {
  appRoot
}
