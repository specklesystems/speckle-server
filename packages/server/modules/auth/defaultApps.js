'use strict'
const knex = require('@/db/knex')
const Scopes = () => knex('scopes')
const Apps = () => knex('server_apps')
const AppScopes = () => knex('server_apps_scopes')

const { getApp } = require('@/modules/auth/services/apps')
const { Scopes: ScopesConst } = require('@/modules/core/helpers/mainConstants')

let allScopes = []

module.exports = async () => {
  allScopes = await Scopes().select('*')

  // Note: shallow cloning of app objs so as to not interfere with the original objects.
  await registerOrUpdateApp({ ...SpeckleWebApp })
  await registerOrUpdateApp({ ...SpeckleApiExplorer })
  await registerOrUpdateApp({ ...SpeckleDesktopApp })
  await registerOrUpdateApp({ ...SpeckleConnectorApp })
  await registerOrUpdateApp({ ...SpeckleExcel })
}

async function registerOrUpdateApp(app) {
  if (app.scopes && app.scopes === 'all') {
    // let scopes = await Scopes( ).select( '*' )
    // console.log( allScopes.length )
    app.scopes = allScopes.map((s) => s.name)
  }

  const existingApp = await getApp({ id: app.id })
  if (existingApp) {
    updateDefaultApp(app, existingApp)
  } else {
    await registerDefaultApp(app)
  }
}

async function registerDefaultApp(app) {
  try {
    const scopes = app.scopes.map((s) => ({ appId: app.id, scopeName: s }))
    delete app.scopes
    await Apps().insert(app)
    await AppScopes().insert(scopes)
  } catch (e) {
    console.log(e)
  }
}

async function updateDefaultApp(app, existingApp) {
  existingApp.scopes = existingApp.scopes.map((s) => s.name)

  const scopeDiffA = app.scopes.filter(
    (scope) => existingApp.scopes.indexOf(scope) === -1
  )
  const scopeDiffB = existingApp.scopes.filter(
    (scope) => app.scopes.indexOf(scope) === -1
  )

  if (scopeDiffA.length !== 0 || scopeDiffB.length !== 0) {
    const scopes = app.scopes.map((s) => ({ appId: app.id, scopeName: s }))
    await AppScopes().insert(scopes)
  }

  delete app.scopes
  await Apps().where({ id: app.id }).update(app)
}

// this is exported to be able to test the retention of permissions
module.exports.updateDefaultApp = updateDefaultApp

const SpeckleWebApp = {
  id: 'spklwebapp',
  secret: 'spklwebapp',
  name: 'Speckle Web Manager',
  description:
    'The Speckle Web Manager is your one-stop place to manage and coordinate your data.',
  trustByDefault: true,
  public: true,
  redirectUrl: process.env.CANONICAL_URL,
  scopes: 'all'
}

const SpeckleApiExplorer = {
  id: 'explorer',
  secret: 'explorer',
  name: 'Speckle Explorer',
  description: 'GraphiQL Playground with authentication.',
  trustByDefault: true,
  public: true,
  redirectUrl: new URL('/explorer', process.env.CANONICAL_URL).toString(),
  scopes: 'all'
}

const SpeckleDesktopApp = {
  id: 'sdm',
  secret: 'sdm',
  name: 'Speckle Desktop Manager',
  description:
    'Manages local installations of Speckle connectors, kits and everything else.',
  trustByDefault: true,
  public: true,
  redirectUrl: 'speckle://account',
  scopes: [
    ScopesConst.Streams.Read,
    ScopesConst.Streams.Write,
    ScopesConst.Profile.Read,
    ScopesConst.Profile.Email,
    ScopesConst.Users.Read,
    ScopesConst.Users.Invite
  ]
}

const SpeckleConnectorApp = {
  id: 'sca',
  secret: 'sca',
  name: 'Speckle Connector',
  description: 'A Speckle Desktop Connectors.',
  trustByDefault: true,
  public: true,
  redirectUrl: 'http://localhost:29363',
  scopes: [
    ScopesConst.Streams.Read,
    ScopesConst.Streams.Write,
    ScopesConst.Profile.Read,
    ScopesConst.Profile.Email,
    ScopesConst.Users.Read,
    ScopesConst.Users.Invite
  ]
}

const SpeckleExcel = {
  id: 'spklexcel',
  secret: 'spklexcel',
  name: 'Speckle Connector For Excel',
  description:
    'The Speckle Connector For Excel. For more info, check the docs here: https://speckle.guide/user/excel.',
  trustByDefault: true,
  public: true,
  redirectUrl: 'https://speckle-excel.netlify.app',
  scopes: [
    ScopesConst.Streams.Read,
    ScopesConst.Streams.Write,
    ScopesConst.Profile.Read,
    ScopesConst.Profile.Email,
    ScopesConst.Users.Read
  ]
}
