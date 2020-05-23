'use strict'
const bcrypt = require( 'bcrypt' )
const crs = require( 'crypto-random-string' )
const root = require( 'app-root-path' )
const knex = require( `${root}/db/knex` )

const Users = ( ) => knex( 'users' )
const ServerRoles = ( ) => knex( 'server_acl' )

module.exports = {

  /*
  
      Users

   */

  async createUser( user ) {
    let [ { count } ] = await ServerRoles( ).where( { role: 'server:admin' } ).count( )

    user.id = crs( { length: 10 } )

    if ( user.password ) {
      user.passwordDigest = await bcrypt.hash( user.password, 10 )
      delete user.password
    }

    let res = await Users( ).returning( 'id' ).insert( user )

    if ( parseInt( count ) === 0 ) {
      await ServerRoles( ).insert( { userId: res[ 0 ], role: 'server:admin' } )
    } else {
      await ServerRoles( ).insert( { userId: res[ 0 ], role: 'server:user' } )
    }

    return res[ 0 ]
  },

  async getUser( id ) {
    let user = await Users( ).where( { id: id } ).select( '*' ).first( )
    delete user.passwordDigest
    return user
  },

  async getUserRole( id ) {
    let { role } = await ServerRoles( ).where( { userId: id } ).select( 'role' ).first( )
    return role 
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