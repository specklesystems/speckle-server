'use strict'
const { registerOrUpdateScope } = require('@/modules/shared')
const { moduleLogger } = require('@/logging/logging')

exports.init = async () => {
  moduleLogger.info('💌 Init invites module')

  const scopes = require('./scopes.js')
  for (const scope of scopes) {
    await registerOrUpdateScope(scope)
  }
}

exports.finalize = async () => {}
