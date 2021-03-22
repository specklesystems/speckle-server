'use strict'
let debug = require( 'debug' )
const appRoot = require( 'app-root-path' )
const { registerOrUpdateScope } = require( `${appRoot}/modules/shared` )

exports.init = async ( app, options ) => {
  debug( 'speckle:modules' )( '🔑 Init auth module' )

  // Initialise authn strategies
  exports.authStrategies = await require( './strategies' )( app )

  // Hoist auth routes
  require( './rest' )( app )

  // Register core-based scoeps
  const scopes = require( './scopes.js' )
  for ( let scope of scopes ) {
    await registerOrUpdateScope( scope )
  }
}

exports.finalize = async () => {
  // Note: we're registering the default apps last as we want to ensure that all
  // scopes have been registered by any other modules.
  await require( './defaultApps' )()
}
