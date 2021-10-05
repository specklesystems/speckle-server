'use strict'

module.exports = require( 'knex' )( {
  client: 'pg',
  connection: process.env.PG_CONNECTION_STRING || 'postgres://speckle:speckle@localhost/speckle',
  pool: { min: 1, max: 1 }
  // migrations are in managed in the server package
} )
