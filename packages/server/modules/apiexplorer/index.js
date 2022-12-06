/* istanbul ignore file */
'use strict'
const { moduleLogger } = require('@/logging/logging')

exports.init = (app) => {
  moduleLogger.info('💅 Init graphql api explorer module')

  // sweet and simple
  app.get('/explorer', (req, res) => {
    res.sendFile(require.resolve('#/assets/apiexplorer/templates/explorer.html'))
  })
}

exports.finalize = () => {}
