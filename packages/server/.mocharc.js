// Need to init env vars for accurate FF reading
const dotenv = require('dotenv')
dotenv.config({ path: `./.env.test` })
dotenv.config({ path: `./.env` })

// Resolve FF values for ignore patterns
const Environment = require('@speckle/shared/dist/commonjs/environment/index.js')
const featureFlags = Environment.getFeatureFlags()
const ignore = [
  ...(!featureFlags.FF_AUTOMATE_MODULE_ENABLED ? ['modules/automate/**/*'] : []),
  ...(!featureFlags.FF_WORKSPACES_MODULE_ENABLED ? ['modules/workspaces/**/*'] : [])
]

/** @type {import("mocha").MochaOptions} */
const config = {
  spec: ['modules/**/*.spec.js', 'modules/**/*.spec.ts', 'logging/**/*.spec.js'],
  require: ['ts-node/register', 'test/hooks.ts'],
  ...(ignore.length ? { ignore } : {}),
  slow: 0,
  timeout: '150000',
  exit: true
}

module.exports = config
