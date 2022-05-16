'use strict'
const bcrypt = require('bcrypt')
const crs = require('crypto-random-string')
const knex = require(`@/db/knex`)

const { createToken, createBareToken } = require(`@/modules/core/services/tokens`)
const Users = () => knex('users')
const ApiTokens = () => knex('api_tokens')
const ServerApps = () => knex('server_apps')
const ServerAppsScopes = () => knex('server_apps_scopes')
const ServerAppsTokens = () => knex('user_server_app_tokens')
const Scopes = () => knex('scopes')

const AuthorizationCodes = () => knex('authorization_codes')
const RefreshTokens = () => knex('refresh_tokens')

module.exports = {
  async getApp({ id }) {
    const allScopes = await Scopes().select('*')

    const app = await ServerApps().select('*').where({ id }).first()
    if (!app) return null

    const appScopeNames = (
      await ServerAppsScopes().select('scopeName').where({ appId: id })
    ).map((s) => s.scopeName)

    app.scopes = allScopes.filter((scope) => appScopeNames.indexOf(scope.name) !== -1)
    app.author = await Users()
      .select('id', 'name', 'avatar')
      .where({ id: app.authorId })
      .first()
    return app
  },

  async getAllPublicApps() {
    const apps = await ServerApps()
      .select(
        'server_apps.id',
        'server_apps.name',
        'server_apps.description',
        'server_apps.trustByDefault',
        'server_apps.logo',
        'server_apps.termsAndConditionsLink',
        'users.name as authorName',
        'users.id as authorId'
      )
      .where({ public: true })
      .leftJoin('users', 'users.id', '=', 'server_apps.authorId')
      .orderBy('server_apps.trustByDefault', 'DESC')

    apps.forEach((app) => {
      if (app.authorName) {
        app.author = { name: app.authorName, id: app.authorId }
      }
      delete app.authorName
      delete app.authorId
    })

    return apps
  },

  async getAllAppsCreatedByUser({ userId }) {
    const apps = await ServerApps()
      .select(
        'server_apps.id',
        'server_apps.secret',
        'server_apps.name',
        'server_apps.description',
        'server_apps.redirectUrl',
        'server_apps.logo',
        'server_apps.termsAndConditionsLink',
        'users.name as authorName',
        'users.id as authorId'
      )
      .where({ authorId: userId })
      .leftJoin('users', 'users.id', '=', 'server_apps.authorId')

    apps.forEach((app) => {
      if (app.authorName) {
        app.author = { name: app.authorName, id: app.authorId }
      }
      delete app.authorName
      delete app.authorId
    })

    return apps
  },

  async getAllAppsAuthorizedByUser({ userId }) {
    const query = knex.raw(
      `
      SELECT DISTINCT ON (a."appId") a."appId" as id, sa."name", sa."description",  sa."trustByDefault", sa."redirectUrl" as "redirectUrl", sa.logo, sa."termsAndConditionsLink", json_build_object('name', u.name, 'id', sa."authorId") as author
      FROM user_server_app_tokens a
      LEFT JOIN server_apps sa ON sa.id = a."appId"
      LEFT JOIN users u ON sa."authorId" = u.id
      WHERE a."userId" = ?
      `,
      [userId]
    )

    const { rows } = await query
    return rows
  },

  async createApp(app) {
    app.id = crs({ length: 10 })
    app.secret = crs({ length: 10 })

    if (!app.scopes) {
      throw new Error('Cannot create an app with no scopes.')
    }

    const scopes = [...app.scopes]

    delete app.scopes
    delete app.firstparty
    delete app.trustByDefault

    await ServerApps().insert(app)
    await ServerAppsScopes().insert(
      scopes.map((s) => ({ appId: app.id, scopeName: s }))
    )
    return { id: app.id, secret: app.secret }
  },

  async updateApp({ app }) {
    // any app update should nuke everything and force users to re-authorize it.
    await module.exports.revokeExistingAppCredentials({ appId: app.id })

    if (app.scopes) {
      // console.log( app.scopes, app.id )
      // Flush existing app scopes
      await ServerAppsScopes().where({ appId: app.id }).del()
      // Update new scopes
      await ServerAppsScopes().insert(
        app.scopes.map((s) => ({ appId: app.id, scopeName: s }))
      )
    }

    delete app.secret
    delete app.scopes

    const [{ id }] = await ServerApps()
      .returning('id')
      .where({ id: app.id })
      .update(app)

    return id
  },

  async deleteApp({ id }) {
    await module.exports.revokeExistingAppCredentials({ appId: id })

    return await ServerApps().where({ id }).del()
  },

  async revokeRefreshToken({ tokenId }) {
    tokenId = tokenId.slice(0, 10)
    await RefreshTokens().where({ id: tokenId }).del()
    return true
  },

  async revokeExistingAppCredentials({ appId }) {
    await AuthorizationCodes().where({ appId }).del()
    await RefreshTokens().where({ appId }).del()

    const resApiTokenDelete = await ApiTokens()
      .whereIn('id', (qb) => {
        qb.select('tokenId').from('user_server_app_tokens').where({ appId })
      })
      .del()

    return resApiTokenDelete
  },

  async revokeExistingAppCredentialsForUser({ appId, userId }) {
    await AuthorizationCodes().where({ appId, userId }).del()
    await RefreshTokens().where({ appId, userId }).del()
    const resApiTokenDelete = await ApiTokens()
      .whereIn('id', (qb) => {
        qb.select('tokenId').from('user_server_app_tokens').where({ appId, userId })
      })
      .del()

    return resApiTokenDelete
  },

  async createAuthorizationCode({ appId, userId, challenge }) {
    const ac = {
      id: crs({ length: 42 }),
      appId,
      userId,
      challenge
    }

    await AuthorizationCodes().insert(ac)
    return ac.id
  },

  async createAppTokenFromAccessCode({ appId, appSecret, accessCode, challenge }) {
    const code = await AuthorizationCodes().select().where({ id: accessCode }).first()

    if (!code) throw new Error('Access code not found.')
    if (code.appId !== appId)
      throw new Error('Invalid request: application id does not match.')

    await AuthorizationCodes().where({ id: accessCode }).del()

    const timeDiff = Math.abs(Date.now() - new Date(code.createdAt))
    if (timeDiff > code.lifespan) {
      throw new Error('Access code expired')
    }

    if (code.challenge !== challenge) throw new Error('Invalid request')

    const app = await ServerApps().select('*').where({ id: appId }).first()

    if (!app) throw new Error('Invalid app')
    if (app.secret !== appSecret) throw new Error('Invalid app credentials')

    const scopes = await ServerAppsScopes().select('scopeName').where({ appId })

    const appScopes = scopes.map((s) => s.scopeName)

    const { token: appToken } = await createToken({
      userId: code.userId,
      name: `${app.name}-token`,
      /* lifespan: 1.21e+9, */ scopes: appScopes
    })

    await ServerAppsTokens().insert({
      userId: code.userId,
      tokenId: appToken.slice(0, 10),
      appId
    })

    const bareToken = await createBareToken()

    const refreshToken = {
      id: bareToken.tokenId,
      tokenDigest: bareToken.tokenHash,
      appId: app.id,
      userId: code.userId
    }

    await RefreshTokens().insert(refreshToken)

    return {
      token: appToken,
      refreshToken: bareToken.tokenId + bareToken.tokenString
    }
  },

  async refreshAppToken({ refreshToken, appId, appSecret }) {
    const refreshTokenId = refreshToken.slice(0, 10)
    const refreshTokenContent = refreshToken.slice(10, 42)

    const refreshTokenDb = await RefreshTokens()
      .select('*')
      .where({ id: refreshTokenId })
      .first()

    if (!refreshTokenDb) throw new Error('Invalid request')

    if (refreshTokenDb.appId !== appId) throw new Error('Invalid request')

    const timeDiff = Math.abs(Date.now() - new Date(refreshTokenDb.createdAt))
    if (timeDiff > refreshTokenDb.lifespan) {
      await RefreshTokens().where({ id: refreshTokenId }).del()
      throw new Error('Refresh token expired')
    }

    const valid = await bcrypt.compare(refreshTokenContent, refreshTokenDb.tokenDigest)
    if (!valid) throw new Error('Invalid token') // sneky hackstors

    const app = await module.exports.getApp({ id: appId })
    if (app.secret !== appSecret) throw new Error('Invalid request')

    // Create the new token
    const { token: appToken } = await createToken({
      userId: refreshTokenDb.userId,
      name: `${app.name}-token`,
      scopes: app.scopes.map((s) => s.name)
    })

    await ServerAppsTokens().insert({
      userId: refreshTokenDb.userId,
      tokenId: appToken.slice(0, 10),
      appId
    })

    // Create a new refresh token
    const bareToken = await createBareToken()

    const freshRefreshToken = {
      id: bareToken.tokenId,
      tokenDigest: bareToken.tokenHash,
      appId,
      userId: refreshTokenDb.userId
    }

    await RefreshTokens().insert(freshRefreshToken)

    // Finally return
    return {
      token: appToken,
      refreshToken: bareToken.tokenId + bareToken.tokenString
    }
  }
}
