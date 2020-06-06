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
    }
    delete user.password

    let usr = await Users( ).select( 'id' ).where( { email: user.email } ).first( )
    if ( usr ) throw new Error( 'Email taken. Try logging in?' )

    let res = await Users( ).returning( 'id' ).insert( user )

    if ( parseInt( count ) === 0 ) {
      await ServerRoles( ).insert( { userId: res[ 0 ], role: 'server:admin' } )
    } else {
      await ServerRoles( ).insert( { userId: res[ 0 ], role: 'server:user' } )
    }

    return res[ 0 ]
  },

  async findOrCreateUser( { user, rawProfile } ) {
    let existingUser = await Users( ).select( 'id' ).where( { email: user.email } ).first( )

    if ( existingUser )
      return existingUser

    user.password = crs( { length: 20 } )
    user.verified = true // because we trust the external identity provider, no?
    return { id: await module.exports.createUser( user ) }
  },

  async getUser( id ) {
    let user = await Users( ).where( { id: id } ).select( '*' ).first( )
    delete user.passwordDigest
    return user
  },

  async getUserByEmail( { email } ) {
    let user = await Users( ).where( { email: email } ).select( '*' ).first( )
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

  async validatePasssword( { email, password } ) {
    var { passwordDigest } = await Users( ).where( { email: email } ).select( 'passwordDigest' ).first( )
    return bcrypt.compare( password, passwordDigest )
  },

  async deleteUser( id ) {
    throw new Error( 'not implemented' )
  }
}