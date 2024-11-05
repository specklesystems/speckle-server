import { getDefaultApps } from '@/modules/auth/defaultApps'
import {
  CreateAppTokenFromAccessCode,
  CreateRefreshToken,
  DeleteAuthorizationCode,
  GetAllScopes,
  GetApp,
  GetAuthorizationCode,
  GetRefreshToken,
  InitializeDefaultApps,
  RegisterDefaultApp,
  RevokeRefreshToken,
  UpdateDefaultApp
} from '@/modules/auth/domain/operations'
import { ScopeRecord } from '@/modules/auth/helpers/types'
import { CreateAndStoreAppToken } from '@/modules/core/domain/tokens/operations'
import { createBareToken } from '@/modules/core/services/tokens'
import { ServerScope } from '@speckle/shared'
import bcrypt from 'bcrypt'

/**
 * Cached all scopes. Caching occurs on first initializeDefaultApps() call
 */
let allScopes: ScopeRecord[] = []

export const initializeDefaultAppsFactory =
  (deps: {
    getAllScopes: GetAllScopes
    getApp: GetApp
    updateDefaultApp: UpdateDefaultApp
    registerDefaultApp: RegisterDefaultApp
  }): InitializeDefaultApps =>
  async () => {
    allScopes = await deps.getAllScopes()

    await Promise.all(
      getDefaultApps().map(async (app) => {
        const scopes =
          app?.scopes === 'all'
            ? allScopes.map((s) => s.name)
            : (app.scopes as ServerScope[])

        const existingApp = await deps.getApp({ id: app.id })
        if (existingApp) {
          await deps.updateDefaultApp(
            {
              ...app,
              scopes
            },
            existingApp
          )
        } else {
          await deps.registerDefaultApp({
            ...app,
            scopes
          })
        }
      })
    )
  }

export const createAppTokenFromAccessCodeFactory =
  (deps: {
    getAuthorizationCode: GetAuthorizationCode
    deleteAuthorizationCode: DeleteAuthorizationCode
    getApp: GetApp
    createRefreshToken: CreateRefreshToken
    createAppToken: CreateAndStoreAppToken
    createBareToken: typeof createBareToken
  }): CreateAppTokenFromAccessCode =>
  async ({ appId, appSecret, accessCode, challenge }) => {
    const code = await deps.getAuthorizationCode({ id: accessCode })

    if (!code) throw new Error('Access code not found.')
    if (code.appId !== appId)
      throw new Error('Invalid request: application id does not match.')

    await deps.deleteAuthorizationCode({ id: accessCode })

    const timeDiff = Math.abs(Date.now() - new Date(code.createdAt).getTime())
    if (timeDiff > code.lifespan) {
      throw new Error('Access code expired')
    }

    if (code.challenge !== challenge) throw new Error('Invalid request')

    const app = await deps.getApp({ id: appId })

    if (!app) throw new Error('Invalid app')
    if (app.secret !== appSecret) throw new Error('Invalid app credentials')

    const appScopes = app.scopes.map((s) => s.name)

    const appToken = await deps.createAppToken({
      userId: code.userId,
      name: `${app.name}-token`,
      scopes: appScopes,
      appId
    })

    const bareToken = await deps.createBareToken()

    const refreshToken = {
      id: bareToken.tokenId,
      tokenDigest: bareToken.tokenHash,
      appId: app.id,
      userId: code.userId
    }

    await deps.createRefreshToken({ token: refreshToken })

    return {
      token: appToken,
      refreshToken: bareToken.tokenId + bareToken.tokenString
    }
  }

export const refreshAppTokenFactory =
  (deps: {
    getRefreshToken: GetRefreshToken
    revokeRefreshToken: RevokeRefreshToken
    createRefreshToken: CreateRefreshToken
    getApp: GetApp
    createAppToken: CreateAndStoreAppToken
    createBareToken: typeof createBareToken
  }) =>
  async (params: { refreshToken: string; appId: string; appSecret: string }) => {
    const { refreshToken, appId, appSecret } = params

    const refreshTokenId = refreshToken.slice(0, 10)
    const refreshTokenContent = refreshToken.slice(10, 42)

    const refreshTokenDb = await deps.getRefreshToken({ id: refreshTokenId })

    if (!refreshTokenDb) throw new Error('Invalid request')

    if (refreshTokenDb.appId !== appId) throw new Error('Invalid request')

    const timeDiff = Math.abs(Date.now() - new Date(refreshTokenDb.createdAt).getTime())
    if (timeDiff > refreshTokenDb.lifespan) {
      await deps.revokeRefreshToken({ tokenId: refreshTokenId })
      throw new Error('Refresh token expired')
    }

    const valid = await bcrypt.compare(refreshTokenContent, refreshTokenDb.tokenDigest)
    if (!valid) throw new Error('Invalid token') // sneky hackstors

    const app = await deps.getApp({ id: appId })
    if (!app || app.secret !== appSecret) throw new Error('Invalid request')

    // Create the new token
    const appToken = await deps.createAppToken({
      userId: refreshTokenDb.userId,
      name: `${app.name}-token`,
      scopes: app.scopes.map((s) => s.name),
      appId
    })

    // Create a new refresh token
    const bareToken = await deps.createBareToken()

    const freshRefreshToken = {
      id: bareToken.tokenId,
      tokenDigest: bareToken.tokenHash,
      appId,
      userId: refreshTokenDb.userId
    }

    await deps.createRefreshToken({ token: freshRefreshToken })

    // Finally return
    return {
      token: appToken,
      refreshToken: bareToken.tokenId + bareToken.tokenString
    }
  }
