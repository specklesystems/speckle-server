'use strict'

const debug = require( 'debug' )( 'speckle:middleware' )

let authenticate = ( req, res, next ) => {
  // TODO
  // Authenticates the api call
  debug( '🔒 authentication middleware called' )
  next( )
}

let authorize = ( req, res, next ) => {
  // TODO
  // Authorizes the api call against permissions
  debug( '🔑 authorization middleware called' )
  next( )
}

let announce = ( req, res, next ) => {
  // TODO
  // Implement event system
  debug( '📣 announce middleware called' )
  next( )
}

let customMiddleware = {}

module.exports = {
  get authenticate( ) {
    return authenticate
  },
  set authenticate( value ) {
    authenticate = value
  },
  get authorize( ) {
    return authorize
  },
  set authorize( value ) {
    authorize = value
  },
  get announce( ) {
    return announce
  },
  set announce( value ) {
    announce = value
  },
  registerCustomMiddleware( name, fn ) {
    customMiddleware[ name ] = fn
  },
  getCustomMiddleware( name ) {
    return customMiddleware[ name ]
  }
}