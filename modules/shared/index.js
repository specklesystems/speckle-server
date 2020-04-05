'use strict'

const debug = require( 'debug' )( 'speckle:test' )
const root = require( 'app-root-path' )
const { validateToken } = require( `${root}/modules/core/users/services` )

function authenticate( scope, mandatory ) {
  mandatory = mandatory || true

  return async ( req, res, next ) => {
    debug( `🔑 authenticate middleware called` )
    
    if ( !req.headers.authorization && mandatory ) {
      return res.status( 403 ).send( { error: 'No credentials provided' } ) // next (err)?
    }

    let token = req.headers.authorization.split( ' ' )[ 1 ]
    let { valid, scopes, userId } = await validateToken( token )

    if ( !valid && mandatory ) {
      return res.status( 403 ).send( { error: 'Invalid authorization' } )
    }

    if ( scopes.indexOf( scope ) === -1 && scopes.indexOf( '*' ) === -1 ) {
      return res.status( 403 ).send( { error: 'Invalid scope' } )
    }

    req.user = { userId: userId, scopes: scopes }
    next( )
  }
}

let authorize = ( req, res, next ) => {
  // TODO
  // Authorizes the api call against permissions
  debug( '🔑 authorization middleware called; yes by default LOL' )
  next( )
}

function announce( eventName, eventScope ) {
  return async ( req, res, next ) => {
    debug( `📣 announce middleware called: ${eventName}:${eventScope}` )
    debug( `Event data: ${JSON.stringify( req.eventData )}` )
    next( )
  }
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