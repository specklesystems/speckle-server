'use strict'
const debug = require('debug')
const { registerOrUpdateScope } = require('@/modules/shared')

exports.init = async () => {
  debug('speckle:modules')('💌 Init invites module')

  const scopes = require('./scopes.js')
  for (const scope of scopes) {
    await registerOrUpdateScope(scope)
  }
}

exports.finalize = async () => {}
