/* eslint-disable camelcase */
'use strict'

module.exports = require('knex')({
  client: 'pg',
  connection: {
    application_name: 'speckle_knex_metrics_debugger',
    connectionString:
      process.env.PG_CONNECTION_STRING || 'postgres://speckle:speckle@127.0.0.1/speckle'
  },
  pool: { min: 0, max: 25 }
  // migrations are in managed in the server package
})
