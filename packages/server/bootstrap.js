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
const config = require('@/config')(`${packageRoot}/config.schema.json`)

// If running in test env, load .env.test first
// (appRoot necessary, cause env files aren't loaded through require() calls)
if (config.isTestEnv()) {
  const { error } = dotenv.config({ path: `${packageRoot}/.env.test` })
  if (error) {
    const e = new Error(
      'Attempting to run tests without an .env.test file properly set up! Check readme!'
    )
    console.error(e)
    process.exit(1)
  }
}

dotenv.config({ path: `${packageRoot}/.env` })

if (config.isApolloMonitoringEnabled() && !config.apolloServerVersion()) {
  config.copy('speckle_server_version', 'apollo.server_user_version')
}

module.exports = {
  config,
  appRoot,
  packageRoot
}
