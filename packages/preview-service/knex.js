/* eslint-disable camelcase */
'use strict'

module.exports = require('knex')({
  client: 'pg',
  connection: {
    application_name: 'speckle_preview_service',
    connectionString:
      process.env.PG_CONNECTION_STRING || 'postgres://speckle:speckle@127.0.0.1/speckle'
  },
  pool: {
    min: 0,
    max: parseInt(process.env.POSTGRES_MAX_CONNECTIONS_PREVIEW_SERVICE) || 2,
    acquireTimeoutMillis: 16000, //allows for 3x creation attempts plus idle time between attempts
    createTimeoutMillis: 5000
  }
  // migrations are in managed in the server package
})
