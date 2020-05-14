'use strict'
const { ForbiddenError, ApolloError } = require( 'apollo-server-express' )
const debug = require( 'debug' )( 'speckle:middleware' )
const root = require( 'app-root-path' )
const knex = require( `${root}/db/knex` )
const { validateToken } = require( `${root}/modules/core/services/users` )

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
    
    Graphql authorization: checks user id against access control lists

 */

let roles = { admin: 1000, owner: 300, write: 200, read: 100 }

async function authorizeResolver( userId, resourceId, aclTable, resourceTable, requiredRole ) {
  let ACL = ( ) => knex( aclTable )
  let Resource = ( ) => knex( resourceTable )

  try {
    let { isPublic } = await Resource( ).where( { id: resourceId } ).select( 'isPublic' ).first( )
    // only return here if it's a read operation: weight < 200. 
    if ( isPublic && roles[ requiredRole ] < 200 ) return true
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

module.exports = {
  contextApiTokenHelper,
  validateScopes,
  authorizeResolver
}