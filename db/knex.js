'use strict'

let env = process.env.NODE_ENV || 'development'
let conf = require( '../knexfile.js' )[ env ]

console.log( `Loaded knex conf for ${env}` )

module.exports = require( 'knex' )( conf )