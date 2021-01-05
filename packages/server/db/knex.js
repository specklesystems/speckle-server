/* istanbul ignore file */
'use strict'

let env = process.env.NODE_ENV || 'development'
let conf = require( '../knexfile.js' )[ env ]

conf.log = {
  warn( message ) {
    if ( message === 'FS-related option specified for migration configuration. This resets migrationSource to default FsMigrations' ) return
  }
}

const debug = require( 'debug' )

debug( 'speckle:db-startup' )( `Loaded knex conf for ${env}` )

module.exports = require( 'knex' )( conf )
