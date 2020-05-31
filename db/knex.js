'use strict'

let env = process.env.NODE_ENV || 'development'
let conf = require( '../knexfile.js' )[ env ]
const debug = require( 'debug' )

debug( 'speckle:db-startup' )( `Loaded knex conf for ${env}` )

module.exports = require( 'knex' )( conf )