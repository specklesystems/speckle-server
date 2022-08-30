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
const convict = require('convict')
convict.addFormat(require('convict-format-with-validator').ipaddress)
const config = convict(path.join(packageRoot, './config.schema.json'))

// TODO move these decorators out of here
config.isTestEnv = function () {
  return this.get('env') === 'test'
}

config.isDevelopmentEnv = function () {
  return this.get('env') === 'development'
}

config.isProductionEnv = function () {
  return this.get('env') === 'production'
}

config.isApolloMonitoringEnabled = function () {
  return this.get('apollo.schema_reporting')
}

config.apolloServerVersion = function () {
  return this.get('apollo.server_user_version')
}

config.getBindAddress = function () {
  // defaults differ depending on the environment
  if (this.isProductionEnv()) {
    return this.get('bind_address') || '0.0.0.0'
  }

  return this.get('bind_address') || '127.0.0.1'
}

config.copy = function (fromProperty, toProperty) {
  this.set(toProperty, this.get(fromProperty))
}

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
