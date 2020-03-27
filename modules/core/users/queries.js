'use strict'
const bcrypt = require( 'bcrypt' )
const root = require( 'app-root-path' )
const knex = require( `${root}/db/knex` )

// const Streams = ( ) => knex( 'streams' )
// const References = () => knex('references')

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
    let res = await Users( ).returning( 'id username name email profiles verified' ).where( { id: id } ).first( )
    return res
  },

  updateUser: async ( id, user ) => {
    delete user.id
    delete user.password_digest
    delete user.email
    await Users( ).where( { id: id } ).update( user )

    // throw new Error( 'not implemented' )
  },

  deleteUser: ( id ) => {
    throw new Error( 'not implemented' )
  },

  createToken: ( userId, name, scopes ) => {
    throw new Error( 'not implemented' )
  },

  revokeToken: ( ) => {
    throw new Error( 'not implemented' )
  }
}