/* istanbul ignore file */
'use strict'

// Seed the table with the applications we're going to provide. They have
// invariant ids so they can work across multiple servers.
exports.up = async knex => {

  //
  // 1) The Desktop Manager
  //
  await knex( 'server_apps' ).insert( {
    id: 'sdm',
    secret: 'sdm',
    name: 'Speckle Desktop Manager',
    description: 'Manages local installations of Speckle connectors, kits and everything else.',
    trustByDefault: true,
    public: true,
    redirectUrl: 'speckle://account' // will redirect to a local server
  } )

  const desktopConnectorScopes = [
    { appId: 'sdm', scopeName: 'streams:read' },
    { appId: 'sdm', scopeName: 'streams:write' },
    { appId: 'sdm', scopeName: 'profile:read' },
    { appId: 'sdm', scopeName: 'profile:email' },
    { appId: 'sdm', scopeName: 'users:read' },
  ]
  await knex( 'server_apps_scopes' ).insert( desktopConnectorScopes )

  //
  // 2. The main server web app
  //
  await knex( 'server_apps' ).insert( {
    id: 'spklwebapp',
    secret: 'spklwebapp',
    name: 'Speckle Web Manager',
    description: `
    The Speckle Web Manager is your one-stop place to manage and coordinate your data.
    `,
    trustByDefault: true,
    public: true,
    redirectUrl: 'self'
  } )

  const scopes = await knex( 'scopes' ).select( '*' )
  const webAppScopes = scopes.map( s => ( { appId: 'spklwebapp', scopeName: s.name } ) )
  await knex( 'server_apps_scopes' ).insert( webAppScopes )

  //
  // 3. The api explorer app
  //
  await knex( 'server_apps' ).insert( {
    id: 'explorer',
    secret: 'explorer',
    name: 'Speckle API Explorer',
    description: 'GraphQL Playground with authentication.',
    trustByDefault: true,
    public: true,
    redirectUrl: '/explorer',
  } )

  const explorerScopes = scopes.filter( s => s.name !== 'server:setup' ).map( s => ( { appId: 'explorer', scopeName: s.name } ) )
  await knex( 'server_apps_scopes' ).insert( explorerScopes )

  //
  // 4. Mock application
  //
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
}
