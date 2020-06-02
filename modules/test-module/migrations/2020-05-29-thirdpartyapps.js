'use strict'

// Knex table migrations
exports.up = async knex => {
  await knex.schema.createTable( 'server_apps', table => {
    table.string( 'id', 10 ).primary( )
    table.string( 'name' ).notNullable( )
    table.string( 'author' ).notNullable( )
    table.string( 'description' )
    table.string( 'ownerId' ).references( 'id' ).inTable( 'users' ).onDelete( 'cascade' )
    table.timestamp( 'createdAt' ).defaultTo( knex.fn.now( ) )
    table.string( 'redirectUrl' ).notNullable( )
    table.boolean( 'firstparty' ).defaultTo( false ).notNullable( )
  } )

  await knex.schema.createTable( 'user_server_apps', table => {
    table.string( 'appId' ).references( 'id' ).inTable( 'server_apps' ).notNullable( ).onDelete( 'cascade' ).index( )
    table.string( 'userId' ).references( 'id' ).inTable( 'users' ).notNullable( ).onDelete( 'cascade' ).index( )
  } )

  // Seed the table with the two applications we're going to provide. They have invariant ids :) 
  // 1) Desktop connectors
  // await knex( 'server_apps' ).insert( {
  //   id: 'connectors',
  //   name: 'Speckle Desktop Connectors',
  //   description: 'These are the desktop connectors for various authoring software (Rhino, Revit, etc.).',
  //   author: 'Speckle',
  //   redirectUrl: 'http://localhost:24707', // will redirect to a local server 
  //   firstparty: true
  // } )

  // The main server web app
  await knex( 'server_apps' ).insert( {
    id: 'spklwebapp',
    name: 'Speckle',
    description: 'This is the main Speckle server web application.',
    author: 'Speckle',
    redirectUrl: 'self', // ie, will just redirect to window.location
    firstparty: true
  } )

  // Mock application
  await knex( 'server_apps' ).insert( {
    id: 'mock',
    name: 'Mock Application',
    description: 'Lorem ipsum dolor sic amet.',
    author: 'Radomir',
    redirectUrl: 'http://localhost:1337', // ie, will just redirect to window.location
    firstparty: false
  } )

  // Tracks which scopes are available to each individual app.
  await knex.schema.createTable( 'server_apps_scopes', table => {
    table.string( 'appId' ).references( 'id' ).inTable( 'server_apps' ).notNullable( ).onDelete( 'cascade' ).index( )
    table.string( 'scopeName' ).references( 'name' ).inTable( 'scopes' ).notNullable( ).onDelete( 'cascade' ).index( )
  } )

  const scopes = await knex( 'scopes' ).select( '*' )
  const webAppScopes = scopes.filter( s => s.name !== 'server:setup' ).map( s => ( { appId: 'spklwebapp', scopeName: s.name } ) )
  await knex( 'server_apps_scopes' ).insert( webAppScopes )
  const mockAppScopes = [ { appId: 'mock', scopeName: 'streams:read' }, { appId: 'mock', scopeName: 'streams:write' } ]
  await knex( 'server_apps_scopes' ).insert( mockAppScopes )

}

exports.down = async knex => {
  await knex.schema.dropTableIfExists( 'server_apps_scopes' )
  await knex.schema.dropTableIfExists( 'user_server_apps' )

  await knex.schema.dropTableIfExists( 'server_apps' )
}