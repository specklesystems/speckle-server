'use strict'
const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )

const Roles = ( ) => knex( 'user_roles' )
const Scopes = ( ) => knex( 'scopes' )
const Info = ( ) => knex( 'server_config' )

module.exports = {

  async getServerInfo( ) {

    return await Info( ).select( '*' ).first( )

  },

  async getAllScopes( ) {

    return await Scopes( ).select( '*' )

  },

  async getPublicScopes() {

    return await Scopes( ).select( '*' ).where( { public: true } )

  },

  async getAllRoles( ) {

    return await Roles( ).select( '*' )

  },

  async getPublicRoles() {

    return await Roles( ).select( '*' ).where( { public: true } )

  },

  async updateServerInfo( { name, company, description, adminContact, termsOfService } ) {

    let serverInfo = await Info( ).select( '*' ).first( )
    if ( !serverInfo )
      return await Info( ).insert( { name, company, description, adminContact, termsOfService, completed: true } )
    else
      return await Info( ).where( { id: 0 } ).update( { name, company, description, adminContact, termsOfService, completed: true } )

  }
}
