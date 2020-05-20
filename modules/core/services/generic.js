'use strict'
const root = require( 'app-root-path' )
const knex = require( `${root}/db/knex` )

const Roles = ( ) => knex( 'user_roles' )
const Scopes = ( ) => knex( 'app_scopes' )

module.exports = {

  async getAvailableScopes( ) {
    return await Roles( ).select( '*' )
  },

  async getAvailableRoles( ) {
    return await Scopes( ).select( '*' )
  },

  async getServerInfo( ) {
    return { todo: true }
  }
}