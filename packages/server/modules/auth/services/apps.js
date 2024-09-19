'use strict'
const bcrypt = require('bcrypt')
const knex = require(`@/db/knex`)

const { createBareToken, createAppToken } = require(`@/modules/core/services/tokens`)
const { getAppFactory } = require('@/modules/auth/repositories/apps')
const RefreshTokens = () => knex('refresh_tokens')

module.exports = {
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
