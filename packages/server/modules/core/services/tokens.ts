import bcrypt from 'bcrypt'
import crs from 'crypto-random-string'
import knex, { db } from '@/db/knex'
import {
  ServerAcl,
  ApiTokens,
  PersonalApiTokens,
  TokenScopes,
  UserServerAppTokens,
  TokenResourceAccess
} from '@/modules/core/dbSchema'
import {
  TokenResourceAccessRecord,
  TokenValidationResult
} from '@/modules/core/helpers/types'
import { Optional, ServerRoles } from '@speckle/shared'
import { TokenResourceIdentifierInput } from '@/modules/core/graph/generated/graphql'
import { UserInputError } from '@/modules/core/errors/userinput'
import { getTokenAppInfoFactory } from '@/modules/auth/repositories/apps'

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

export async function createToken({
  userId,
  name,
  scopes,
  lifespan,
  limitResources
}: {
  userId: string
  name: string
  scopes: string[]
  lifespan?: number | bigint
  /**
   * Optionally limit the resources that the token can access
   */
  limitResources?: TokenResourceIdentifierInput[] | null
}) {
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

  await ApiTokens.knex().insert(token)
  await Promise.all([
    TokenScopes.knex().insert(tokenScopes),
    ...(resourceAccessEntries?.length
      ? [TokenResourceAccess.knex().insert(resourceAccessEntries)]
      : [])
  ])

  return { id: tokenId, token: tokenId + tokenString }
}

export async function createAppToken(
  params: Parameters<typeof createToken>[0] & { appId: string }
) {
  const token = await createToken(params)
  await UserServerAppTokens.knex().insert({
    tokenId: token.token.slice(0, 10),
    userId: params.userId,
    appId: params.appId
  })
  return token.token
}

// Creates a personal access token for a user with a set of given scopes.
export async function createPersonalAccessToken(
  userId: string,
  name: string,
  scopes: string[],
  lifespan?: number | bigint
) {
  const { id, token } = await createToken({
    userId,
    name,
    scopes,
    lifespan
  })

  // Store the relationship
  await PersonalApiTokens.knex().insert({ userId, tokenId: id })

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

export async function revokeTokenById(tokenId: string) {
  const delCount = await ApiTokens.knex()
    .where({ id: tokenId.slice(0, 10) })
    .del()

  if (delCount === 0) throw new Error('Token revokation failed')
  return true
}

export async function getUserTokens(userId: string) {
  const { rows } = await knex.raw(
    `
      SELECT
        t.id,
        t.name,
        t."lastChars",
        t."createdAt",
        t.lifespan,
        t."name",
        t."lastUsed",
        ts.scopes
      FROM
        api_tokens t
        JOIN (
          SELECT
            ARRAY_AGG(token_scopes. "scopeName") AS "scopes",
            token_scopes. "tokenId" AS id
          FROM
            token_scopes
            JOIN api_tokens ON "api_tokens"."id" = "token_scopes"."tokenId"
          GROUP BY
            token_scopes. "tokenId" ) ts USING (id)
      WHERE
        t.id IN(
          SELECT
            "tokenId" FROM personal_api_tokens
          WHERE
            "userId" = ? )
    `,
    [userId]
  )
  return rows as {
    id: string
    name: string | null
    lastChars: string | null
    createdAt: Date
    lifespan: number
    lastUsed: Date
    scopes: string[]
  }[]
}
