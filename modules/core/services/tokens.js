'use strict'
const bcrypt = require( 'bcrypt' )
const crs = require( 'crypto-random-string' )
const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )

const Users = ( ) => knex( 'users' )
const ApiTokens = ( ) => knex( 'api_tokens' )
const PersonalApiTokens = ( ) => knex( 'personal_api_tokens' )

const TokenScopes = ( ) => knex( 'token_scopes' )
const ServerRoles = ( ) => knex( 'server_acl' )
const ServerApps = ( ) => knex( 'server_apps' )
const ServerAppsScopes = ( ) => knex( 'server_apps_scopes' )

module.exports = {

  /*

      Tokens
      Note: tokens are composed of a 10 char token id and a 32 char token string.
      The token string is smoked, salted and hashed and stored in the database.

   */

  async createBareToken( ) {
    let tokenId = crs( { length: 10 } )
    let tokenString = crs( { length: 32 } )
    let tokenHash = await bcrypt.hash( tokenString, 10 )
    let lastChars = tokenString.slice( tokenString.length - 6, tokenString.length )

    return { tokenId, tokenString, tokenHash, lastChars }
  },

  async createToken( { userId, name, scopes, lifespan } ) {
    let { tokenId, tokenString, tokenHash, lastChars } = await module.exports.createBareToken( )

    if ( scopes.length === 0 ) throw new Error( 'No scopes provided' )

    let token = {
      id: tokenId,
      tokenDigest: tokenHash,
      lastChars: lastChars,
      owner: userId,
      name: name,
      lifespan: lifespan
    }
    let tokenScopes = scopes.map( scope => ( { tokenId: tokenId, scopeName: scope } ) )

    await ApiTokens( ).insert( token )
    await TokenScopes( ).insert( tokenScopes )

    return { id: tokenId, token: tokenId + tokenString }
  },

  // Creates a personal access token for a user with a set of given scopes.
  async createPersonalAccessToken( userId, name, scopes, lifespan ) {
    let { id, token } = await module.exports.createToken( { userId, name, scopes, lifespan } )

    // Store the relationship
    await PersonalApiTokens( ).insert( { userId: userId, tokenId: id } )

    return token
  },

  async validateToken( tokenString ) {
    let tokenId = tokenString.slice( 0, 10 )
    let tokenContent = tokenString.slice( 10, 42 )

    let token = await ApiTokens( ).where( { id: tokenId } ).select( '*' ).first( )

    if ( !token ) {
      return { valid: false }
    }

    const timeDiff = Math.abs( Date.now( ) - new Date( token.createdAt ) )
    if ( timeDiff > token.lifespan ) {
      await module.exports.revokeToken( tokenId, token.owner )
      return { valid: false }
    }

    let valid = await bcrypt.compare( tokenContent, token.tokenDigest )

    if ( valid ) {
      await ApiTokens( ).where( { id: tokenId } ).update( { lastUsed: knex.fn.now( ) } )
      let scopes = await TokenScopes( ).select( 'scopeName' ).where( { tokenId: tokenId } )
      let { role } = await ServerRoles( ).select( 'role' ).where( { userId: token.owner } ).first( )
      return { valid: true, userId: token.owner, role: role, scopes: scopes.map( s => s.scopeName ) }
    } else
      return { valid: false }
  },

  async revokeToken( tokenId, userId ) {
    tokenId = tokenId.slice( 0, 10 )
    let delCount = await ApiTokens( ).where( { id: tokenId, owner: userId } ).del( )

    if ( delCount === 0 )
      throw new Error( 'Did not revoke token' )
    return true
  },

  async revokeTokenById( tokenId ) {
    let delCount = await ApiTokens( ).where( { id: tokenId.slice( 0, 10 ) } ).del( )

    if ( delCount === 0 )
      throw new Error( 'Token revokation failed' )
    return true
  },

  async getUserTokens( userId ) {
    let { rows } = await knex.raw( `
      SELECT
        t.id,
        t.name,
        t."lastChars",
        t."createdAt",
        t.lifespan,
        t."name",
        t."lastUsed",
        ts.scopes
      FROM
        api_tokens t
        JOIN (
          SELECT
            ARRAY_AGG(token_scopes. "scopeName") AS "scopes",
            token_scopes. "tokenId" AS id
          FROM
            token_scopes
            JOIN api_tokens ON "api_tokens"."id" = "token_scopes"."tokenId"
          GROUP BY
            token_scopes. "tokenId" ) ts USING (id)
      WHERE
        t.id IN(
          SELECT
            "tokenId" FROM personal_api_tokens
          WHERE
            "userId" = ? )
    `, [ userId ] )
    return rows
  }
}
