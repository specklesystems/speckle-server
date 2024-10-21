/* istanbul ignore file */
/**
 * Bootstrap module that should be imported at the very top of each entry point module
 */

// Conditionally change appRoot and packageRoot according to whether we're running from /dist/ or not (ts-node)
const path = require('path')
const isTsNode = !!process[Symbol.for('ts-node.register.instance')]
const appRoot = __dirname
const packageRoot = isTsNode ? appRoot : path.resolve(__dirname, '../')

// Initializing module aliases for absolute import paths
const moduleAlias = require('module-alias')
moduleAlias.addAliases({
  '@': appRoot,
  '#': packageRoot
})

// Initializing env vars
const dotenv = require('dotenv')
const {
  isTestEnv,
  isApolloMonitoringEnabled,
  getApolloServerVersion,
  getServerVersion
} = require('./modules/shared/helpers/envHelper')
const { logger } = require('@/logging/logging')

if (isApolloMonitoringEnabled() && !getApolloServerVersion()) {
  process.env.APOLLO_SERVER_USER_VERSION = getServerVersion()
}

//knex is a singleton controlled by module so can't wait til app init
const { initOpenTelemetry } = require('./otel')
initOpenTelemetry()

// If running in test env, load .env.test first
// (appRoot necessary, cause env files aren't loaded through require() calls)
if (isTestEnv()) {
  const { error } = dotenv.config({ path: `${packageRoot}/.env.test` })
  if (error) {
    const e = new Error(
      'Attempting to run tests without an .env.test file properly set up! Check readme!'
    )
    logger.error(e)
    process.exit(1)
  }
}

dotenv.config({ path: `${packageRoot}/.env` })

module.exports = {
  appRoot,
  packageRoot
}
