/* istanbul ignore file */
'use strict'

// Knex table migrations
exports.up = async knex => {
  // Applications that integrate with this server.
  await knex.schema.createTable( 'server_apps', table => {
    table.string( 'id', 10 ).primary( )
    table.string( 'secret', 10 )

    table.string( 'name', 200 ).notNullable( )
    table.string( 'description', 500 )
    table.string( 'termsAndConditionsLink', 100 )
    table.string( 'logo' )

    table.boolean( 'public' ).defaultTo( false )

    table.string( 'authorId' ).references( 'id' ).inTable( 'users' ).onDelete( 'cascade' )
    table.timestamp( 'createdAt' ).defaultTo( knex.fn.now( ) )

    table.string( 'redirectUrl', 100 ).notNullable( )
  } )

  // Tracks which scopes are available to each individual app.
  await knex.schema.createTable( 'server_apps_scopes', table => {
    table.string( 'appId' ).references( 'id' ).inTable( 'server_apps' ).notNullable( ).onDelete( 'cascade' ).index( )
    table.string( 'scopeName' ).references( 'name' ).inTable( 'scopes' ).notNullable( ).onDelete( 'cascade' ).index( )
  } )

  await knex.schema.createTable( 'authorization_codes', table => {
    table.string( 'id' ).primary( )
    table.string( 'appId' ).references( 'id' ).inTable( 'server_apps' ).onDelete( 'cascade' )
    table.string( 'userId' ).references( 'id' ).inTable( 'users' ).onDelete( 'cascade' )
    table.string( 'challenge' ).notNullable( )
    table.timestamp( 'createdAt' ).defaultTo( knex.fn.now( ) )
    table.bigint( 'lifespan' ).defaultTo( 6e+5 ) // 10 minutes
  } )

  await knex.schema.createTable( 'refresh_tokens', table => {
    table.string( 'id' ).primary( )
    table.string( 'tokenDigest' ).notNullable( )
    table.string( 'appId' ).references( 'id' ).inTable( 'server_apps' ).onDelete( 'cascade' )
    table.string( 'userId' ).references( 'id' ).inTable( 'users' ).onDelete( 'cascade' )
    table.timestamp( 'createdAt' ).defaultTo( knex.fn.now( ) )
    table.bigint( 'lifespan' ).defaultTo( 1.577e+10 ) // 6 months
  } )

  await knex.schema.createTable( 'user_server_app_tokens', table => {
    table.string( 'appId' ).references( 'id' ).inTable( 'server_apps' ).notNullable( ).onDelete( 'cascade' ).index( )
    table.string( 'userId' ).references( 'id' ).inTable( 'users' ).notNullable( ).onDelete( 'cascade' ).index( )
    table.string( 'tokenId' ).references( 'id' ).inTable( 'api_tokens' ).notNullable( ).onDelete( 'cascade' ).index( )
  } )



  // Seed the table with the two applications we're going to provide. They have invariant ids :)
  // 1) Desktop connectors
  await knex( 'server_apps' ).insert( {
    id: 'sdm',
    secret: 'sdm',
    name: 'Speckle Desktop Manager',
    description: 'Manages local installations of Speckle connectors, kits and everything else.',
    redirectUrl: 'speckle://', // will redirect to a local server
  } )

  const desktopConnectorScopes = [
    { appId: 'sdm', scopeName: 'streams:read' },
    { appId: 'sdm', scopeName: 'streams:write' },
    { appId: 'sdm', scopeName: 'profile:read' },
    { appId: 'sdm', scopeName: 'profile:email' },
    { appId: 'sdm', scopeName: 'users:read' },
  ]
  await knex( 'server_apps_scopes' ).insert( desktopConnectorScopes )

  // The main server web app
  await knex( 'server_apps' ).insert( {
    id: 'spklwebapp',
    secret: 'spklwebapp',
    name: 'Speckle',
    description: 'This is the main Speckle server web application.',
    redirectUrl: 'self', // ie, will just redirect to window.location
  } )

  const scopes = await knex( 'scopes' ).select( '*' )
  const webAppScopes = scopes.filter( s => s.name !== 'server:setup' ).map( s => ( { appId: 'spklwebapp', scopeName: s.name } ) )
  await knex( 'server_apps_scopes' ).insert( webAppScopes )

  // The api explorer app
  await knex( 'server_apps' ).insert( {
    id: 'explorer',
    secret: 'explorer',
    name: 'Speckle API Explorer',
    description: 'GraphQL Playground with authentication.',
    redirectUrl: '/explorer',
  } )

  const explorerScopes = scopes.filter( s => s.name !== 'server:setup' ).map( s => ( { appId: 'explorer', scopeName: s.name } ) )
  await knex( 'server_apps_scopes' ).insert( explorerScopes )

  // Mock application
  await knex( 'server_apps' ).insert( {
    id: 'mock',
    secret: '12345',
    name: 'Mock Application',
    description: 'Lorem ipsum dolor sic amet.',
    redirectUrl: 'http://localhost:1337', // ie, will just redirect to window.location
  } )

  const mockAppScopes = [ { appId: 'mock', scopeName: 'streams:read' }, { appId: 'mock', scopeName: 'users:read' }, { appId: 'mock', scopeName: 'profile:email' } ]
  await knex( 'server_apps_scopes' ).insert( mockAppScopes )
}

exports.down = async knex => {
  await knex.schema.dropTableIfExists( 'server_apps_scopes' )
  await knex.schema.dropTableIfExists( 'authorization_codes' )
  await knex.schema.dropTableIfExists( 'refresh_tokens' )
  await knex.schema.dropTableIfExists( 'user_server_app_tokens' )

  await knex.schema.dropTableIfExists( 'server_apps' )
}
