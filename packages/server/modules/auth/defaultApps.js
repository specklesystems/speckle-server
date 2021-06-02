'use strict'
const appRoot = require( 'app-root-path' )
const knex = require( `${appRoot}/db/knex` )
const Scopes = ( ) => knex( 'scopes' )
const Apps = () => knex( 'server_apps' )
const AppScopes = ( ) => knex( 'server_apps_scopes' )

const { getApp, revokeExistingAppCredentials } = require( './services/apps' )

let allScopes = []

module.exports = async () => {
  allScopes = await Scopes( ).select( '*' )

  // Note: shallow cloning of app objs so as to not interfere with the original objects.
  await registerOrUpdateApp( { ...SpeckleWebApp } )
  await registerOrUpdateApp( { ...SpeckleApiExplorer } )
  await registerOrUpdateApp( { ...SpeckleDesktopApp } )
  await registerOrUpdateApp( { ...SpeckleExcel } )

}

async function registerOrUpdateApp( app ) {

  if ( app.scopes && app.scopes === 'all' ) {
    // let scopes = await Scopes( ).select( '*' )
    // console.log( allScopes.length )
    app.scopes = allScopes.map( s => s.name )
  }

  let existingApp = await getApp( { id: app.id } )
  if ( existingApp ) {
    updateDefaultApp( app, existingApp )
  } else {
    await registerDefaultApp( app )
  }
}

async function registerDefaultApp( app ) {
  try {
    let scopes = app.scopes.map( s => ( { appId: app.id, scopeName: s } ) )
    delete app.scopes
    await Apps().insert( app )
    await AppScopes().insert( scopes )
  } catch ( e ){
    console.log( e )
  }
}

async function updateDefaultApp( app, existingApp ) {
  existingApp.scopes = existingApp.scopes.map( s => s.name )

  let scopeDiffA = app.scopes.filter( scope => existingApp.scopes.indexOf( scope ) === -1 )
  let scopeDiffB = existingApp.scopes.filter( scope => app.scopes.indexOf( scope ) === -1 )

  if ( scopeDiffA.length !== 0 || scopeDiffB.length !== 0 ){
    await revokeExistingAppCredentials( { appId: app.id } )
    let scopes = app.scopes.map( s => ( { appId: app.id, scopeName: s } ) )
    await AppScopes().insert( scopes )
  }

  delete app.scopes
  await Apps( ).where( { id: app.id } ).update( app )
}

let SpeckleWebApp = {
  id: 'spklwebapp',
  secret: 'spklwebapp',
  name: 'Speckle Web Manager',
  description: 'The Speckle Web Manager is your one-stop place to manage and coordinate your data.',
  trustByDefault: true,
  public: true,
  redirectUrl: process.env.CANONICAL_URL,
  scopes: 'all'
}

let SpeckleApiExplorer = {
  id: 'explorer',
  secret: 'explorer',
  name: 'Speckle Explorer',
  description: 'GraphiQL Playground with authentication.',
  trustByDefault: true,
  public: true,
  redirectUrl: ( new URL( '/explorer', process.env.CANONICAL_URL ) ).toString(),
  scopes: 'all'
}

let SpeckleDesktopApp = {
  id: 'sdm',
  secret: 'sdm',
  name: 'Speckle Desktop Manager',
  description: 'Manages local installations of Speckle connectors, kits and everything else.',
  trustByDefault: true,
  public: true,
  redirectUrl: 'speckle://account',
  scopes: [ 'streams:read', 'streams:write', 'profile:read', 'profile:email', 'users:read' ]
}

let SpeckleExcel = {
  id: 'spklexcel',
  secret: 'spklexcel',
  name: 'Speckle Connector For Excel',
  description: 'The Speckle Connector For Excel. For more info, check the docs here: https://speckle.guide/user/excel.',
  trustByDefault: true,
  public: true,
  redirectUrl: 'https://speckle-excel.netlify.app',
  scopes: [ 'streams:read', 'streams:write', 'profile:read', 'profile:email', 'users:read' ]
}

