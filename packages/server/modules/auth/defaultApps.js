'use strict'
const debug = require('debug')
const knex = require('@/db/knex')
const Scopes = () => knex('scopes')
const Apps = () => knex('server_apps')
const AppScopes = () => knex('server_apps_scopes')

const { getApp } = require('@/modules/auth/services/apps')
const { Scopes: ScopesConst } = require('@/modules/core/helpers/mainConstants')
const { difference } = require('lodash')

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
  const existingAppScopes = existingApp.scopes.map((s) => s.name)

  const newScopes = difference(app.scopes, existingAppScopes)
  const removedScopes = difference(existingAppScopes, app.scopes)

  let affectedTokenIds = []

  if (newScopes.length || removedScopes.length) {
    debug('speckle:modules')(`🔑 Updating default app ${app.name}`)
    affectedTokenIds = await knex('user_server_app_tokens')
      .where({ appId: app.id })
      .pluck('tokenId')
  }

  // the internal code block makes sure if an error occurred, the trx gets rolled back
  await knex.transaction(async (trx) => {
    // add new scopes to the app
    if (newScopes.length)
      await AppScopes()
        .insert(newScopes.map((s) => ({ appId: app.id, scopeName: s })))
        .transacting(trx)

    // remove scopes from the app
    if (removedScopes.length)
      await AppScopes()
        .where({ appId: app.id })
        .whereIn('scopeName', removedScopes)
        .delete()
        .transacting(trx)

    //update user tokens with scope changes
    if (affectedTokenIds.length)
      await Promise.all(
        affectedTokenIds.map(async (tokenId) => {
          if (newScopes.length)
            await knex('token_scopes')
              .insert(newScopes.map((s) => ({ tokenId, scopeName: s })))
              .transacting(trx)

          if (removedScopes.length)
            await knex('token_scopes')
              .where({ tokenId })
              .whereIn('scopeName', removedScopes)
              .delete()
              .transacting(trx)
        })
      )
    delete app.scopes
    await Apps().where({ id: app.id }).update(app).transacting(trx)
  })
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
    ScopesConst.Users.Read
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
