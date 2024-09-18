import { getDefaultApps } from '@/modules/auth/defaultApps'
import {
  CreateAppTokenFromAccessCode,
  CreateRefreshToken,
  DeleteAuthorizationCode,
  GetAllScopes,
  GetApp,
  GetAuthorizationCode,
  InitializeDefaultApps,
  RegisterDefaultApp,
  UpdateDefaultApp
} from '@/modules/auth/domain/operations'
import { ScopeRecord } from '@/modules/auth/helpers/types'
import { createAppToken, createBareToken } from '@/modules/core/services/tokens'
import { ServerScope } from '@speckle/shared'

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
    createAppToken: typeof createAppToken
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
