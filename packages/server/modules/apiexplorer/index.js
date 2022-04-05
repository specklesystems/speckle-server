/* istanbul ignore file */
'use strict'
const debug = require('debug')
const appRoot = require('app-root-path')

exports.init = (app) => {
  debug('speckle:modules')('💅 Init graphql api explorer module')

  // sweet and simple
  app.get('/explorer', (req, res) => {
    res.sendFile(`${appRoot}/modules/apiexplorer/explorer.html`)
  })
}

exports.finalize = () => {}
