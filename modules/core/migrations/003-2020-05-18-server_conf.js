'use strict'
let debug = require( 'debug' )( 'speckle:modules' )

exports.up = async knex => {
  debug( 'Setting up server base configuration.' )
  await knex( 'server_config' ).insert( {
    company: 'Acme Inc.'
  } )
}

exports.down = async knex => {
  await knex( 'server_config' ).where( true ).delete( )
}