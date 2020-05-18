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
      user.passwordDigest = await bcrypt.hash( user.password, 10 )
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
    delete user.passwordDigest
    delete user.password
    delete user.email
    await Users( ).where( { id: id } ).update( user )
  },

  async validatePasssword( userId, password ) {
    var { passwordDigest } = await Users( ).where( { id: userId } ).select( 'passwordDigest' ).first( )
    return bcrypt.compare( password, passwordDigest )
  },

  async deleteUser( id ) {
    throw new Error( 'not implemented' )
  }
}