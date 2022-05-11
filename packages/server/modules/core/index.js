'use strict'
const debug = require('debug')
const { registerOrUpdateScope, registerOrUpdateRole } = require('@/modules/shared')

exports.init = async (app) => {
  debug('speckle:modules')('💥 Init core module')

  // Initialises the two main bulk upload/download endpoints
  require('./rest/upload')(app)
  require('./rest/download')(app)

  // Initialises the two diff-based upload/download endpoints
  require('./rest/diffUpload')(app)
  require('./rest/diffDownload')(app)

  // Register core-based scoeps
  const scopes = require('./scopes.js')
  for (const scope of scopes) {
    await registerOrUpdateScope(scope)
  }

  // Register core-based roles
  const roles = require('./roles.js')
  for (const role of roles) {
    await registerOrUpdateRole(role)
  }
}

exports.finalize = () => {}
