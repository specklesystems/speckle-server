'use strict'
const { ForbiddenError, ApolloError } = require( 'apollo-server-express' )
const debug = require( 'debug' )( 'speckle:middleware' )
const root = require( 'app-root-path' )
const knex = require( `${root}/db/knex` )
const { validateToken } = require( `${root}/modules/core/services/tokens` )

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

let roles

async function authorizeResolver( userId, resourceId, requiredRole ) {
  if ( !roles )
    roles = await knex( 'user_roles' ).select( '*' )

  // TODO: Cache these results with a TTL of 1 mins or so, it's pointless to query the db every time we get a ping. 

  let role = roles.find( r => r.name === requiredRole )

  if ( role === undefined || role === null ) throw new ApolloError( 'Unknown role: ' + requiredRole )

  try {
    let { isPublic } = await knex( role.resourceTarget ).select( 'isPublic' ).where( { id: resourceId } ).first( )
    if ( isPublic && roles[ requiredRole ] < 200 ) return true
  } catch ( e ) {
    throw new ApolloError( `Resource of type ${resourceTable} with ${resourceId} not found` )
  }

  let entry = await knex( role.aclTableName ).select( '*' ).where( { resourceId: resourceId, userId: userId } ).first( )

  if ( !entry ) throw new ForbiddenError( 'You are not authorized' )

  entry.role = roles.find( r => r.name === entry.role )

  if ( entry.role.weight >= role.weight )
    return true
  else
    throw new ForbiddenError( 'You are not authorized' )

}

module.exports = {
  contextApiTokenHelper,
  validateScopes,
  authorizeResolver
}