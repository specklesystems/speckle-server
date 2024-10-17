import bcrypt from 'bcrypt'
import crs from 'crypto-random-string'
import knex, { db } from '@/db/knex'
import {
  ServerAcl,
  ApiTokens,
  TokenScopes,
  TokenResourceAccess
} from '@/modules/core/dbSchema'
import {
  TokenResourceAccessRecord,
  TokenValidationResult
} from '@/modules/core/helpers/types'
import { Optional, ServerRoles, ServerScope } from '@speckle/shared'
import { UserInputError } from '@/modules/core/errors/userinput'
import { getTokenAppInfoFactory } from '@/modules/auth/repositories/apps'
import {
  CreateAndStoreAppToken,
  CreateAndStorePersonalAccessToken,
  CreateAndStoreUserToken,
  StoreApiToken,
  StorePersonalApiToken,
  StoreTokenResourceAccessDefinitions,
  StoreTokenScopes,
  StoreUserServerAppToken
} from '@/modules/core/domain/tokens/operations'

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

export async function validateToken(
  tokenString: string
): Promise<TokenValidationResult> {
  const tokenId = tokenString.slice(0, 10)
  const tokenContent = tokenString.slice(10, 42)

  const token = await ApiTokens.knex().where({ id: tokenId }).select('*').first()

  if (!token) {
    return { valid: false }
  }

  const timeDiff = Math.abs(Date.now() - new Date(token.createdAt).getTime())
  if (timeDiff > token.lifespan) {
    await revokeToken(tokenId, token.owner)
    return { valid: false }
  }

  const getTokenAppInfo = getTokenAppInfoFactory({ db })
  const valid = await bcrypt.compare(tokenContent, token.tokenDigest)

  if (valid) {
    const [scopes, acl, app, resourceAccessRules] = await Promise.all([
      TokenScopes.knex()
        .select<{ scopeName: string }[]>('scopeName')
        .where({ tokenId }),
      ServerAcl.knex()
        .select<{ role: ServerRoles }[]>('role')
        .where({ userId: token.owner })
        .first(),
      getTokenAppInfo({ token: tokenString }),
      TokenResourceAccess.knex<TokenResourceAccessRecord[]>().where({
        [TokenResourceAccess.col.tokenId]: tokenId
      }),
      ApiTokens.knex().where({ id: tokenId }).update({ lastUsed: knex.fn.now() })
    ])
    const role = acl!.role

    return {
      valid: true,
      userId: token.owner,
      role,
      scopes: scopes.map((s) => s.scopeName),
      appId: app?.id || null,
      resourceAccessRules: resourceAccessRules.length ? resourceAccessRules : null
    }
  } else return { valid: false }
}

export async function revokeToken(tokenId: string, userId: string) {
  tokenId = tokenId.slice(0, 10)
  const delCount = await ApiTokens.knex().where({ id: tokenId, owner: userId }).del()
  if (delCount === 0) throw new UserInputError('Did not revoke token')
  return true
}
