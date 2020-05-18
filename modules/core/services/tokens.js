'use strict'
const bcrypt = require( 'bcrypt' )
const crs = require( 'crypto-random-string' )
const root = require( 'app-root-path' )
const knex = require( `${root}/db/knex` )

const Users = ( ) => knex( 'users' )
const Keys = ( ) => knex( 'api_tokens' )

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

    let lastChars = tokenString.slice( tokenString.length - 6, tokenString.length )

    let res = await Keys( ).returning( 'id' ).insert( { id: tokenId, tokenDigest: tokenHash, lastChars: lastChars, owner: userId, name: name, scopes: scopes, lifespan: lifespan } )

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
    let token = await Keys().where({id: tokenId}).select("*")
    let delCount = await Keys( ).where( { id: tokenId, owner: userId } ).del( )

    if ( delCount === 0 )
      throw new Error( 'Did not revoke token' )
    return true
  },

  async getUserTokens( userId ) {
    return Keys( ).where( { owner: userId } ).select( 'id', 'name', 'lastChars', 'scopes', 'createdAt', 'lastUsed' )
  }
}