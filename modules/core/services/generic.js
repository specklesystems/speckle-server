'use strict'
const root = require( 'app-root-path' )
const knex = require( `${root}/db/knex` )

const Roles = ( ) => knex( 'user_roles' )
const Scopes = ( ) => knex( 'app_scopes' )

module.exports = {

  async getAvailableScopes( ) {
    return await Scopes( ).select( '*' )
  },

  async getAvailableRoles( ) {
    return await Roles( ).select( '*' )
  },

  async getServerName( ) {
    return `TODO: True`
  },

  async getServerDescription( ) {
    return `TODO: True`
  },

  async getAdminContact( ) {
    return `TODO: True`
  },

  async getTOS( ) {
    return `TODO: True`
  },
}