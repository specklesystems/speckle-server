'use strict'
const knex = require('@/db/knex')
const Scopes = () => knex('scopes')
const Apps = () => knex('server_apps')
const AppScopes = () => knex('server_apps_scopes')

const { getApp } = require('@/modules/auth/services/apps')
const { difference } = require('lodash')
const { moduleLogger } = require('@/logging/logging')
const { getDefaultApps } = require('@/modules/auth/defaultApps')

let allScopes = []

module.exports = async () => {
  allScopes = await Scopes().select('*')

  // Note: shallow cloning of app objs so as to not interfere with the original objects.
  await Promise.all(getDefaultApps().map((app) => registerOrUpdateApp({ ...app })))
}

async function registerOrUpdateApp(app) {
  if (app.scopes && app.scopes === 'all') {
    // let scopes = await Scopes( ).select( '*' )
    // logger.debug( allScopes.length )
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
  const scopes = app.scopes.map((s) => ({ appId: app.id, scopeName: s }))
  delete app.scopes
  await Apps().insert(app)
  await AppScopes().insert(scopes)
}

async function updateDefaultApp(app, existingApp) {
  const existingAppScopes = existingApp.scopes.map((s) => s.name)

  const newScopes = difference(app.scopes, existingAppScopes)
  const removedScopes = difference(existingAppScopes, app.scopes)

  let affectedTokenIds = []

  if (newScopes.length || removedScopes.length) {
    moduleLogger.info(`🔑 Updating default app ${app.name}`)
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
    // not writing the redirect url to the DB anymore
    // it will be patched on an application level from the default app definitions
    delete app.redirectUrl
    await Apps().where({ id: app.id }).update(app).transacting(trx)
  })
}

// this is exported to be able to test the retention of permissions
module.exports.updateDefaultApp = updateDefaultApp
