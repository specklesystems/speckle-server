'use strict'
const bcrypt = require( 'bcrypt' )
const crs = require( 'crypto-random-string' )
const root = require( 'app-root-path' )
const knex = require( `${root}/db/knex` )

const Users = ( ) => knex( 'users' )
const Keys = ( ) => knex( 'api_tokens' )
const AppScopes = ( ) => knex( 'app_scopes' )
const TokenScopes = ( ) => knex( 'token_scopes' )

module.exports = {

  /*
  
      Tokens
      Note: tokens are composed of a 10 char token id and a 32 char token string.
      The token string is smoked, salted and hashed and stored in the database. 

   */

  async createToken( userId, name, scopes, lifespan ) {
    let tokenId = crs( { length: 10 } )
    let tokenString = crs( { length: 32 } )
    let tokenHash = await bcrypt.hash( tokenString, 10 )

    if ( scopes.length === 0 ) throw new Error( 'No scopes provided' )

    let lastChars = tokenString.slice( tokenString.length - 6, tokenString.length )

    let tRes = await Keys( ).returning( 'id' ).insert( { id: tokenId, tokenDigest: tokenHash, lastChars: lastChars, owner: userId, name: name, lifespan: lifespan } )

    let token_scopes = scopes.map( scope => ( { tokenId: tokenId, scopeName: scope } ) )

    let tsRes = await TokenScopes( ).insert( token_scopes )

    return tokenId + tokenString
  },

  async validateToken( tokenString ) {
    let tokenId = tokenString.slice( 0, 10 )
    let tokenContent = tokenString.slice( 10, 42 )

    let token = await Keys( ).where( { id: tokenId } ).select( '*' ).first( )

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
      await Keys( ).where( { id: tokenId } ).update( { lastUsed: knex.fn.now( ) } )
      return { valid: true, userId: token.owner, scopes: token.scopes }
    } else
      return { valid: false }
  },

  async revokeToken( tokenId, userId ) {
    tokenId = tokenId.slice( 0, 10 )
    let token = await Keys( ).where( { id: tokenId } ).select( "*" )
    let delCount = await Keys( ).where( { id: tokenId, owner: userId } ).del( )

    if ( delCount === 0 )
      throw new Error( 'Did not revoke token' )
    return true
  },

  async getUserTokens( userId ) {
    let { rows } = await knex.raw( `
      SELECT t.id, t.name, tt.scopes
      FROM api_tokens t
      JOIN(
        SELECT ARRAY_AGG(token_scopes."scopeName") as "scopes", token_scopes."tokenId" as id
        FROM token_scopes
        JOIN api_tokens on "api_tokens"."id" = "token_scopes"."tokenId"
        GROUP BY token_scopes."tokenId"
      ) tt USING(id)
      WHERE t."owner" = ?
    `, [ userId ] )
    return rows
    // return Keys( ).where( { owner: userId } ).select( 'id', 'name', 'lastChars', 'createdAt', 'lastUsed' ).rightJoin( 'token_scopes', 'id', '=', 'token_scopes.tokenId' )
  }
}