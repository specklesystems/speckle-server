'use strict'
const { registerOrUpdateScope } = require('@/modules/shared')
const { moduleLogger } = require('@/logging/logging')

exports.init = async (app) => {
  moduleLogger.info('🔑 Init auth module')

  // Initialize authn strategies
  exports.authStrategies = await require('./strategies')(app)

  // Hoist auth routes
  require('./rest')(app)

  // Register core-based scopes
  const scopes = require('./scopes.js')
  for (const scope of scopes) {
    await registerOrUpdateScope(scope)
  }
}

exports.finalize = async () => {
  // Note: we're registering the default apps last as we want to ensure that all
  // scopes have been registered by any other modules.
  await require('./defaultApps')()
}
