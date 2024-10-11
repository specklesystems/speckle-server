/* eslint-disable camelcase */
'use strict'

module.exports = require('knex')({
  client: 'pg',
  connection: {
    application_name: 'speckle_fileimport_service',
    connectionString:
      process.env.PG_CONNECTION_STRING || 'postgres://speckle:speckle@127.0.0.1/speckle'
  },
  pool: {
    min: 0,
    max: parseInt(process.env.POSTGRES_MAX_CONNECTIONS_FILE_IMPORT_SERVICE) || 1,
    acquireTimeoutMillis: 16000, //allows for 3x creation attempts plus idle time between attempts
    createTimeoutMillis: 5000
  }
  // migrations are in managed in the server package
})
