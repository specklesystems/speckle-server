/**
 * Bootstrap module that should be imported at the very top of each entry point module
 */
const appRoot = require('app-root-path')
const dotenv = require('dotenv')
const { isTestEnv } = require('./modules/core/helpers/envHelper')

// If running in test env, load .env.test first
if (isTestEnv()) {
  dotenv.config({ path: `${appRoot}/.env.test` })
}

dotenv.config({ path: `${appRoot}/.env` })
