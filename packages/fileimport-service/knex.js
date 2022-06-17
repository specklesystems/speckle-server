/* eslint-disable camelcase */
'use strict'

module.exports = require('knex')({
  client: 'pg',
  connection: {
    application_name: 'speckle_fileimport_service',
    connectionString:
      process.env.PG_CONNECTION_STRING ||
      'postgres://speckle:speckle@localhost/speckle',
    query_timeout: 4.32e7
  },
  pool: { min: 0, max: 1 }
  // migrations are in managed in the server package
})
