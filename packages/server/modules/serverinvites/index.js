'use strict'
const { registerOrUpdateScopeFactory } = require('@/modules/shared/repositories/scopes')
const { moduleLogger } = require('@/logging/logging')
const db = require('@/db/knex')

exports.init = async () => {
  moduleLogger.info('💌 Init invites module')

  const scopes = require('./scopes.js')
  const registerFunc = registerOrUpdateScopeFactory({ db })
  for (const scope of scopes) {
    await registerFunc({ scope })
  }
}

exports.finalize = async () => {}
