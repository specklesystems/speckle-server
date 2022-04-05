'use strict'
const debug = require('debug')

exports.init = async (app) => {
  debug('speckle:modules')('♻️  Init pwd reset module')

  require('./rest')(app)
}

exports.finalize = async () => {}
