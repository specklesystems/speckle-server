'use strict'
const { ForbiddenError, ApolloError } = require( 'apollo-server-express' )
const debug = require( 'debug' )( 'speckle:middleware' )
const root = require( 'app-root-path' )
const knex = require( `${root}/db/knex` )
const { validateToken } = require( `${root}/modules/core/users/services` )

/*
    
    Authentication middleware: checks bearer token validity and scope validation

 */


// TODO: Cache results
function authenticate( scope, mandatory ) {
  mandatory = mandatory !== false // defaults to true if not provided

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
    
    Graphql server context helper

 */

async function contextApiTokenHelper( { req, res } ) {
  // TODO: Cache results for 5 minutes
  if ( req.headers.authorization ) {

    let token = req.headers.authorization.split( ' ' )[ 1 ]

    let { valid, scopes, userId } = await validateToken( token )

    if ( !valid ) {
      return { auth: false }
    }

    return { auth: true, userId, token, scopes }
  }
}

/*
    
    Graphql scope validator

 */

async function validateScopes( scopes, scope ) {
  if ( !scopes )
    throw new ForbiddenError( 'You do not have the required priviliges.' )
  if ( scopes.indexOf( scope ) === -1 && scopes.indexOf( '*' ) === -1 )
    throw new ForbiddenError( 'You do not have the required priviliges.' )
}


/*
    
    Authorization middleware: checks user id against access control lists

 */

let roles = { admin: 1000, owner: 300, write: 200, read: 100 }

// TODO: Cache results
function authorize( aclTable, resourceTable, requiredRole ) {
  let ACL = ( ) => knex( aclTable )
  let Resource = ( ) => knex( resourceTable )

  return async ( req, res, next ) => {
    debug( '🔑 authorization middleware called' )

    try {
      let { isPublic } = await Resource( ).where( { id: req.params.resourceId } ).select( 'isPublic' ).first( )
      if ( isPublic ) return next( )
    } catch ( e ) {
      let err = new Error( `${req.params.resourceId} was not found.` )
      err.status = 404
      return next( err )
    }

    if ( !req.user ) return res.status( 401 ).send( { error: 'Unauthorized' } )

    let [ entry ] = await ACL( ).where( { resourceId: req.params.resourceId, userId: req.user.id } ).select( '*' )

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
    
    Graphql authorization: checks user id against access control lists

 */

async function authorizeResolver( userId, resourceId, aclTable, resourceTable, requiredRole ) {
  let ACL = ( ) => knex( aclTable )
  let Resource = ( ) => knex( resourceTable )

  try {
    let { isPublic } = await Resource( ).where( { id: resourceId } ).select( 'isPublic' ).first( )
    if ( isPublic ) return true
  } catch ( e ) {
    throw new ApolloError( `Resource of type ${resourceTable} with ${resourceId} not found.` )
  }

  if ( !userId ) throw new AuthenticationError( 'No user id found.' )

  let [ entry ] = await ACL( ).where( { resourceId: resourceId, userId: userId } ).select( '*' )

  if ( !entry )
    throw new ForbiddenError( 'You are not authorized.' )

  if ( roles[ entry.role ] >= roles[ requiredRole ] ) {
    return true
  }
  throw new ForbiddenError( 'You are not authorized.' )
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
  // Express middleware
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
  
  // Grahpql helpers  
  get contextApiTokenHelper( ) {
    return contextApiTokenHelper
  },
  set contextApiTokenHelper( value ) {
    contextApiTokenHelper = value
  },
  get validateScopes( ) {
    return validateScopes
  },
  set validateScopes( value ) {
    validateScopes = value
  },
  get authorizeResolver( ) {
    return authorizeResolver
  },
  set authorizeResolver( value ) {
    authorizeResolver = value
  },

  // Custom helpers
  registerCustomMiddleware( name, fn ) {
    customMiddleware[ name ] = fn
  },
  getCustomMiddleware( name ) {
    return customMiddleware[ name ]
  }
}