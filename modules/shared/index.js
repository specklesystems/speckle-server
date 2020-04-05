'use strict'

const debug = require( 'debug' )( 'speckle:middleware' )
const root = require( 'app-root-path' )
const knex = require( `${root}/db/knex` )
const { validateToken } = require( `${root}/modules/core/users/services` )

/*
    
    Authentication: checks bearer token validity and scope validation

 */


// TODO: Cache results
function authenticate( scope, mandatory ) {
  mandatory = mandatory !== false

  return async ( req, res, next ) => {
    debug( `🔑 authenticate middleware called` )

    if ( !req.headers.authorization && mandatory ) {
      return res.status( 403 ).send( { error: 'No credentials provided' } ) // next (err)?
    }

    if ( req.headers.authorization ) {
      let token = req.headers.authorization.split( ' ' )[ 1 ]
      let { valid, scopes, userId } = await validateToken( token )

      if ( !valid && mandatory ) {
        return res.status( 403 ).send( { error: 'Invalid authorization' } )
      }

      if ( scopes.indexOf( scope ) === -1 && scopes.indexOf( '*' ) === -1 ) {
        return res.status( 403 ).send( { error: 'Invalid scope' } )
      }
      req.user = { id: userId, scopes: scopes }
      return next( )
    }

    return next( )
  }
}

/*
    
    Authorization: checks user id against access control lists

 */

let roles = { admin: 400, owner: 300, write: 200, read: 100 }

// TODO: Cache results
function authorize( aclTable, resourceTable, requiredRole ) {
  let ACL = ( ) => knex( aclTable )
  let Resource = ( ) => knex( resourceTable )

  return async ( req, res, next ) => {
    debug( '🔑 authorization middleware called' )

    let { isPublic } = await Resource( ).where( { id: req.params.resourceId } ).select( 'isPublic' ).first( )

    if ( isPublic ) return next( )

    if ( !req.user ) return res.status( 401 ).send( { error: 'Unauthorized' } )

    let [ entry ] = await ACL( ).where( { resource_id: req.params.resourceId, user_id: req.user.id } ).select( '*' )

    if ( !entry ) {
      return res.status( 401 ).send( { error: 'Unauthorized' } )
    }

    if ( roles[ entry.role ] >= roles[ requiredRole ] ) {
      req.user.role = entry.role
      return next( )
    } else {
      return res.status( 401 ).send( { error: 'Unauthorized' } )
    }
  }
}

/*
    
    Announcements: orchestrates pushing out events to any subscribers. 
    (TODO: implement!)

 */

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