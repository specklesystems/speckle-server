/* eslint-disable camelcase */
'use strict'

module.exports = require('knex')({
  client: 'pg',
  connection: {
    application_name: 'speckle_preview_service',
    connectionString:
      process.env.PG_CONNECTION_STRING ||
      'postgres://speckle:speckle@localhost/speckle',
    query_timeout: 4.32e7
  },
  pool: { min: 0, max: 2 }
  // migrations are in managed in the server package
})
