'use strict'
const bcrypt = require( 'bcrypt' )
const crs = require( 'crypto-random-string' )
const root = require( 'app-root-path' )
const knex = require( `${root}/db/knex` )

const Users = ( ) => knex( 'users' )
const Keys = ( ) => knex( 'api_tokens' )

module.exports = {

  /*
  
      Users

   */

  async createUser( user ) {
    user.id = crs( { length: 10 } )

    if ( user.password ) {
      user.password_digest = await bcrypt.hash( user.password, 10 )
      delete user.password
    }

    let res = await Users( ).returning( 'id' ).insert( user )

    return res[ 0 ]
  },

  async getUser( id ) {
    return Users( ).where( { id: id } ).select( 'id', 'username', 'name', 'email', 'profiles', 'verified' ).first( )
  },

  async updateUser( id, user ) {
    delete user.id
    delete user.password_digest
    delete user.password
    delete user.email
    await Users( ).where( { id: id } ).update( user )
  },

  async validatePasssword( userId, password ) {
    var { password_digest } = await Users( ).where( { id: userId } ).select( 'password_digest' ).first( )
    return bcrypt.compare( password, password_digest )
  },

  async deleteUser( id ) {
    throw new Error( 'not implemented' )
  },

  /*
  
      Tokens
      Note: tokens are composed of a 10 char token id and a 32 char token string.
      The token string is smoked, salted and hashed and stored in the database. 

   */

  async createToken( userId, name, scopes, lifespan ) {
    let tokenId = crs( { length: 10 } )
    let tokenString = crs( { length: 32 } )
    let tokenHash = await bcrypt.hash( tokenString, 10 )

    let last_chars = tokenString.slice( tokenString.length - 6, tokenString.length )

    let res = await Keys( ).returning( 'id' ).insert( { id: tokenId, token_digest: tokenHash, last_chars: last_chars, owner_id: userId, name: name, scopes: scopes, lifespan: lifespan } )

    return tokenId + tokenString
  },

  async validateToken( tokenString ) {
    let tokenId = tokenString.slice( 0, 10 )
    let tokenContent = tokenString.slice( 10, 32 )

    let token = await Keys( ).where( { id: tokenId } ).select( '*' ).first( )

    if ( !token ) {
      return { valid: false }
    }

    const timeDiff = Math.abs( Date.now( ) - new Date( token.created_at ) )
    if ( timeDiff > token.lifespan ) {
      await module.exports.revokeToken( tokenId )
      return { valid: false }
    }

    let valid = bcrypt.compare( tokenContent, token.token_digest )

    if ( valid ) {
      await Keys( ).where( { id: tokenId } ).update( { last_used: knex.fn.now( ) } )
      return { valid: true, userId: token.owner_id, scopes: token.scopes }
    } else
      return { valid: false }
  },

  async revokeToken( tokenId ) {
    tokenId = tokenId.slice( 0, 10 )
    await Keys( ).where( { id: tokenId } ).del( )
  },

  async getUserTokens( userId ) {
    return Keys( ).where( { owner_id: userId } ).select( 'id', 'name', 'last_chars', 'scopes', 'created_at', 'last_used' )
  }
}