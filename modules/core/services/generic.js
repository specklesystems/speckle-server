'use strict'
const root = require( 'app-root-path' )
const knex = require( `${root}/db/knex` )

const Roles = ( ) => knex( 'user_roles' )
const Scopes = ( ) => knex( 'app_scopes' )
const Info = ( ) => knex( 'server_config' )

module.exports = {

  async getServerInfo( ) {
    return await Info( ).select( '*' ).first( )
  },

  async getAvailableScopes( ) {
    return await Scopes( ).select( '*' )
  },

  async getAvailableRoles( ) {
    return await Roles( ).select( '*' )
  },

  async updateServerInfo( { name, company, description, adminContact, termsOfService } ) {
    let serverInfo = await Info( ).select( '*' ).first( )
    if ( !serverInfo )
      await Info( ).insert( { name, company, description, adminContact, termsOfService, completed: true } )
    else
      await Info( ).where( { id: 0 } ).update( { name, company, description, adminContact, termsOfService, completed: true } )
  }
}