/* istanbul ignore file */
'use strict'
const debug = require('debug')

exports.init = (app) => {
  debug('speckle:modules')('💅 Init graphql api explorer module')

  // sweet and simple
  app.get('/explorer', (req, res) => {
    res.sendFile(require.resolve('#/assets/apiexplorer/templates/explorer.html'))
  })
}

exports.finalize = () => {}
