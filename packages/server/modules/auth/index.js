'use strict'
const { registerOrUpdateScopeFactory } = require('@/modules/shared/repositories/scopes')
const { moduleLogger } = require('@/logging/logging')
const db = require('@/db/knex')
const { initializeDefaultAppsFactory } = require('@/modules/auth/services/serverApps')
const {
  getAllScopesFactory,
  getAppFactory,
  updateDefaultAppFactory,
  registerDefaultAppFactory
} = require('@/modules/auth/repositories/apps')

const initializeDefaultApps = initializeDefaultAppsFactory({
  getAllScopes: getAllScopesFactory({ db }),
  getApp: getAppFactory({ db }),
  updateDefaultApp: updateDefaultAppFactory({ db }),
  registerDefaultApp: registerDefaultAppFactory({ db })
})

exports.init = async (app) => {
  moduleLogger.info('🔑 Init auth module')

  // Initialize authn strategies
  exports.authStrategies = await require('./strategies')(app)

  // Hoist auth routes
  require('./rest')(app)

  // Register core-based scopes
  const scopes = require('./scopes.js')
  const registerFunc = registerOrUpdateScopeFactory({ db })
  for (const scope of scopes) {
    await registerFunc({ scope })
  }
}

exports.finalize = async () => {
  // Note: we're registering the default apps last as we want to ensure that all
  // scopes have been registered by any other modules.
  await initializeDefaultApps()
}
