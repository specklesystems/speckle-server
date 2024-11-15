import bcrypt from 'bcrypt'
import crs from 'crypto-random-string'
import {
  TokenResourceAccessRecord,
  TokenValidationResult
} from '@/modules/core/helpers/types'
import { Optional, ServerScope } from '@speckle/shared'
import {
  CreateAndStoreAppToken,
  CreateAndStorePersonalAccessToken,
  CreateAndStoreUserToken,
  GetApiTokenById,
  GetTokenResourceAccessDefinitionsById,
  GetTokenScopesById,
  RevokeUserTokenById,
  StoreApiToken,
  StorePersonalApiToken,
  StoreTokenResourceAccessDefinitions,
  StoreTokenScopes,
  StoreUserServerAppToken,
  UpdateApiToken,
  ValidateToken
} from '@/modules/core/domain/tokens/operations'
import { GetTokenAppInfo } from '@/modules/auth/domain/operations'
import { GetUserRole } from '@/modules/core/domain/users/operations'

/*
  Tokens
  Note: tokens are composed of a 10 char token id and a 32 char token string.
  The token string is smoked, salted and hashed and stored in the database.
*/

export async function createBareToken() {
  const tokenId = crs({ length: 10 })
  const tokenString = crs({ length: 32 })
  const tokenHash = await bcrypt.hash(tokenString, 10)
  const lastChars = tokenString.slice(tokenString.length - 6, tokenString.length)

  return { tokenId, tokenString, tokenHash, lastChars }
}

type CreateTokenDeps = {
  storeApiToken: StoreApiToken
  storeTokenScopes: StoreTokenScopes
  storeTokenResourceAccessDefinitions: StoreTokenResourceAccessDefinitions
}

export const createTokenFactory =
  (deps: CreateTokenDeps): CreateAndStoreUserToken =>
  async ({ userId, name, scopes, lifespan, limitResources }) => {
    const { tokenId, tokenString, tokenHash, lastChars } = await createBareToken()

    if (scopes.length === 0) throw new Error('No scopes provided')

    const token = {
      id: tokenId,
      tokenDigest: tokenHash,
      lastChars,
      owner: userId,
      name,
      lifespan
    }
    const tokenScopes = scopes.map((scope) => ({ tokenId, scopeName: scope }))
    const resourceAccessEntries: Optional<TokenResourceAccessRecord[]> =
      limitResources?.map((resource) => ({
        tokenId,
        resourceId: resource.id,
        resourceType: resource.type
      }))

    await deps.storeApiToken(token)
    await Promise.all([
      deps.storeTokenScopes(tokenScopes),
      ...(resourceAccessEntries?.length
        ? [deps.storeTokenResourceAccessDefinitions(resourceAccessEntries)]
        : [])
    ])

    return { id: tokenId, token: tokenId + tokenString }
  }

export const createAppTokenFactory =
  (
    deps: CreateTokenDeps & {
      storeUserServerAppToken: StoreUserServerAppToken
    }
  ): CreateAndStoreAppToken =>
  async (params) => {
    const token = await createTokenFactory(deps)(params)
    await deps.storeUserServerAppToken({
      tokenId: token.token.slice(0, 10),
      userId: params.userId,
      appId: params.appId
    })
    return token.token
  }

/**
 * Creates a personal access token for a user with a set of given scopes.
 */
export const createPersonalAccessTokenFactory =
  (
    deps: CreateTokenDeps & {
      storePersonalApiToken: StorePersonalApiToken
    }
  ): CreateAndStorePersonalAccessToken =>
  async (
    userId: string,
    name: string,
    scopes: ServerScope[],
    lifespan?: number | bigint
  ) => {
    const { id, token } = await createTokenFactory(deps)({
      userId,
      name,
      scopes,
      lifespan
    })

    // Store the relationship
    await deps.storePersonalApiToken({ userId, tokenId: id })

    return token
  }

export const validateTokenFactory =
  (deps: {
    revokeUserTokenById: RevokeUserTokenById
    getApiTokenById: GetApiTokenById
    getTokenAppInfo: GetTokenAppInfo
    getTokenScopesById: GetTokenScopesById
    getUserRole: GetUserRole
    getTokenResourceAccessDefinitionsById: GetTokenResourceAccessDefinitionsById
    updateApiToken: UpdateApiToken
  }): ValidateToken =>
  async (tokenString: string): Promise<TokenValidationResult> => {
    const tokenId = tokenString.slice(0, 10)
    const tokenContent = tokenString.slice(10, 42)

    const token = await deps.getApiTokenById(tokenId)

    if (!token) {
      return { valid: false }
    }

    const timeDiff = Math.abs(Date.now() - new Date(token.createdAt).getTime())
    if (timeDiff > token.lifespan) {
      await deps.revokeUserTokenById(tokenId, token.owner)
      return { valid: false }
    }

    const valid = await bcrypt.compare(tokenContent, token.tokenDigest)

    if (valid) {
      const [scopes, role, app, resourceAccessRules] = await Promise.all([
        deps.getTokenScopesById(tokenId),
        deps.getUserRole(token.owner),
        deps.getTokenAppInfo({ token: tokenString }),
        deps.getTokenResourceAccessDefinitionsById(tokenId),
        deps.updateApiToken(tokenId, { lastUsed: new Date() })
      ])

      return {
        valid: true,
        userId: token.owner,
        role: role!,
        scopes: scopes.map((s) => s.scopeName),
        appId: app?.id || null,
        resourceAccessRules: resourceAccessRules.length ? resourceAccessRules : null
      }
    } else return { valid: false }
  }
