/* istanbul ignore file */
/**
 * Bootstrap module that should be imported at the very top of each entry point module
 */

// Initializing module aliases for absolute import paths
require('module-alias')({ base: __dirname })

// Initializing env vars
const dotenv = require('dotenv')
const { isTestEnv } = require('./modules/core/helpers/envHelper')
const appRoot = require('app-root-path')

// If running in test env, load .env.test first
// (appRoot necessary, cause env files aren't loaded through require() calls)
if (isTestEnv()) {
  dotenv.config({ path: `${appRoot}/.env.test` })
}

dotenv.config({ path: `${appRoot}/.env` })
