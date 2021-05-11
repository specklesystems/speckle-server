'use strict'
let debug = require( 'debug' )
const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )
const { registerOrUpdateScope, registerOrUpdateRole } = require( `${appRoot}/modules/shared` )

exports.init = async ( app, options ) => {
  debug( 'speckle:modules' )( '💥 Init core module' )

  // Initialises the two main bulk upload/download endpoints
  require( './rest/upload' )( app )
  require( './rest/download' )( app )

  // Initialises the two diff-based upload/download endpoints
  require( './rest/diffUpload' )( app )
  require( './rest/diffDownload' )( app )
  
  // Register core-based scoeps
  const scopes = require( './scopes.js' )
  for ( let scope of scopes ) {
    await registerOrUpdateScope( scope )
  }

  // Register core-based roles
  const roles = require( './roles.js' )
  for ( let role of roles ) {
    await registerOrUpdateRole( role )
  }
}

exports.finalize = () => {}
