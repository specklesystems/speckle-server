'use strict'
const bcrypt = require( 'bcrypt' )
const crs = require( 'crypto-random-string' )
const root = require( 'app-root-path' )
const knex = require( `${root}/db/knex` )

const Users = ( ) => knex( 'users' )
const Keys = ( ) => knex( 'api_token' )

module.exports = {
  createUser: async ( user ) => {
    delete user.id

    if ( user.password ) {
      user.password_digest = await bcrypt.hash( user.password, 10 )
      delete user.password
    }

    let res = await Users( ).returning( 'id' ).insert( user )

    return res[ 0 ]
  },

  getUser: async ( id ) => {
    return Users( ).where( { id: id } ).select( 'id', 'username', 'name', 'email', 'profiles', 'verified' ).first( )
  },

  updateUser: async ( id, user ) => {
    delete user.id
    delete user.password_digest
    delete user.password
    delete user.email
    await Users( ).where( { id: id } ).update( user )
  },

  validatePasssword: async ( userId, password ) => {
    var { password_digest } = await Users( ).where( { id: userId } ).select( 'password_digest' ).first( )
    return bcrypt.compare( password, password_digest )
  },

  deleteUser: ( id ) => {
    throw new Error( 'not implemented' )
  },

  createToken: async ( userId, name, scopes ) => {
    let tokenId = crs( { length: 10 } )
    let tokenString = crs( { length: 32 } )
    let tokenHash = await bcrypt.hash( tokenString, 10 )

    let last_chars = tokenString.slice( tokenString.length - 6, tokenString.length )

    let res = await Keys( ).returning( 'id' ).insert( { id: tokenId, token_digest: tokenHash, last_chars: last_chars, owner_id: userId, name: name, scopes: scopes } )

    return tokenId + tokenString
  },

  validateToken: async ( tokenString ) => {
    let tokenId = tokenString.slice( 0, 10 )
    let tokenContent = tokenString.slice( 10, 32 )

    let token = await Keys( ).where( { id: tokenId } ).select( '*' ).first( )

    if ( !token ) {
      return { valid: false }
    }

    let valid = bcrypt.compare( tokenContent, token.token_digest )

    if ( valid ) {
      await Keys( ).where( { id: tokenId } ).update( { last_used: knex.fn.now( ) } )
      return { valid: true, userId: token.owner_id, scopes: token.scopes }
    } else
      return { valid: false }
  },

  revokeToken: async ( tokenId ) => {
    tokenId = tokenId.slice( 0, 10 )
    await Keys( ).where( { id: tokenId } ).del( )
  },

  getUserTokens: async ( userId ) => {
    return Keys( ).where( { owner_id: userId } ).select( 'id', 'name', 'last_chars', 'scopes', 'created_at', 'last_used' )
  }
}