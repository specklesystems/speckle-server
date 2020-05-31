'use strict'
const root = require( 'app-root-path' )
const knex = require( `${root}/db/knex` )

const ServerApps = ( ) => knex( 'server_apps' )
const ServerAppsScopes = ( ) => knex( 'server_apps_scopes' )
const Scopes = ( ) => knex( 'scopes' )


let allScopes = null

module.exports = {
  async getApp( { id } ) {
    if ( allScopes === null ) allScopes = await Scopes( ).select( '*' )

    let app = await ServerApps( ).select( '*' ).where( { id: id } ).first( )
    let appScopeNames = ( await ServerAppsScopes( ).select( 'scopeName' ).where( { appId: id } ) ).map( s => s.scopeName )

    app.scopes = allScopes.filter( scope => appScopeNames.indexOf( scope.name ) !== -1 )
    return app
  }
}