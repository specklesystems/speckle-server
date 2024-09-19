'use strict'
const bcrypt = require('bcrypt')
const crs = require('crypto-random-string')
const knex = require(`@/db/knex`)

const { createBareToken, createAppToken } = require(`@/modules/core/services/tokens`)
const { logger } = require('@/logging/logging')
const { getAppFactory } = require('@/modules/auth/repositories/apps')
const ApiTokens = () => knex('api_tokens')
const ServerApps = () => knex('server_apps')
const ServerAppsScopes = () => knex('server_apps_scopes')

const AuthorizationCodes = () => knex('authorization_codes')
const RefreshTokens = () => knex('refresh_tokens')

module.exports = {
  async updateApp({ app }) {
    // any app update should nuke everything and force users to re-authorize it.
    await module.exports.revokeExistingAppCredentials({ appId: app.id })

    if (app.scopes) {
      logger.debug(app.scopes, app.id)
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
    if (!challenge) throw new Error('Please provide a valid challenge.')

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

    const appToken = await createAppToken({
      userId: code.userId,
      name: `${app.name}-token`,
      scopes: appScopes,
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

    const app = await getAppFactory({ db: knex })({ id: appId })
    if (!app || app.secret !== appSecret) throw new Error('Invalid request')

    // Create the new token
    const appToken = await createAppToken({
      userId: refreshTokenDb.userId,
      name: `${app.name}-token`,
      scopes: app.scopes.map((s) => s.name),
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
