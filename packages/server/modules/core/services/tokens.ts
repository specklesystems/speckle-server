'use strict'
import bcrypt from 'bcrypt'
import crs from 'crypto-random-string'
import knex from '@/db/knex'
import { ServerAcl as ServerAclSchema } from '@/modules/core/dbSchema'
import {
  setTokenValidationResultInCache,
  removeTokenValidationResultFromCache,
  tryGetTokenValidationResultFromCache
} from '@/modules/core/services/tokenCache'
import { Brand } from '@/modules/shared/helpers/typeHelper'
import { TokenValidationResult } from '@/modules/core/helpers/types'

const ApiTokens = () => knex('api_tokens')
const PersonalApiTokens = () => knex('personal_api_tokens')

const TokenScopes = () => knex('token_scopes')
const ServerRoles = () => ServerAclSchema.knex()

type AuthTokenInput = {
  userId: UserId
  name: string
  scopes: string[]
  lifespan: number
}
export type TokenId = Brand<string, 'TokenId'>
export type UserId = Brand<string, 'UserId'>
export type RawAuthToken = Brand<string, 'AuthToken'>

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
  lifespan
}: AuthTokenInput): Promise<{ id: TokenId; token: RawAuthToken }> {
  const { tokenId, tokenString, tokenHash, lastChars } =
    await module.exports.createBareToken()

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

  await ApiTokens().insert(token)
  await TokenScopes().insert(tokenScopes)

  return { id: tokenId, token: tokenId + tokenString }
}

// Creates a personal access token for a user with a set of given scopes.
export async function createPersonalAccessToken(
  userId: string,
  name: string,
  scopes: string[],
  lifespan: number
) {
  const { id, token } = await module.exports.createToken({
    userId,
    name,
    scopes,
    lifespan
  })

  // Store the relationship
  await PersonalApiTokens().insert({ userId, tokenId: id })

  return token
}

/**
 *
 * @param {string} tokenString
 * @returns {Promise<import('@/modules/core/helpers/types').TokenValidationResult>}
 */
export async function validateToken(
  tokenString: RawAuthToken
): Promise<TokenValidationResult> {
  const tokenId = tokenString.slice(0, 10) as TokenId
  const tokenContent = tokenString.slice(10, 42)

  // we store the token validation result in the cache for a short period of time
  // this is to avoid hitting the database at every request
  const authContext = await tryGetTokenValidationResultFromCache(tokenId)
  if (authContext) {
    return authContext
  }

  // not in cache, so try database
  const token = await ApiTokens().where({ id: tokenId }).select('*').first()

  if (!token) {
    return { valid: false }
  }

  const tokenCreatedAtMilliseconds = new Date(token.createdAt).getMilliseconds()
  const timeDiff = Math.abs(Date.now() - tokenCreatedAtMilliseconds)
  if (timeDiff > token.lifespan) {
    await module.exports.revokeToken(tokenId, token.owner)
    return { valid: false }
  }

  const valid = await bcrypt.compare(tokenContent, token.tokenDigest)

  if (valid) {
    await ApiTokens().where({ id: tokenId }).update({ lastUsed: knex.fn.now() })
    const scopes = await TokenScopes().select('scopeName').where({ tokenId })
    const { role } = await ServerRoles()
      .select('role')
      .where({ userId: token.owner })
      .first()
    const authContext = {
      valid: true,
      userId: token.owner,
      role,
      scopes: scopes.map((s) => s.scopeName)
    }

    const remainingTokenTimeMilliseconds =
      tokenCreatedAtMilliseconds + token.lifespan - Date.now() //FIXME does the token have a token.expireAt field?
    await setTokenValidationResultInCache(
      tokenId,
      authContext,
      Math.min(10, remainingTokenTimeMilliseconds / 1000)
    ) // cache for 10 seconds or the token lifespan, whichever is shorter

    return authContext
  } else return { valid: false }
}

export async function revokeToken(tokenId: TokenId, userId: UserId) {
  const tokenIdPrefix = tokenId.slice(0, 10) as TokenId //FIXME do we still need this as we are using a branded type now?
  // we don't care if this fails, as it will expire soon anyway
  await removeTokenValidationResultFromCache(tokenIdPrefix)

  const delCount = await ApiTokens().where({ id: tokenIdPrefix, owner: userId }).del()

  if (delCount === 0) throw new Error('Did not revoke token')
  return true
}

export async function revokeTokenById(tokenId: TokenId) {
  // we don't care if this fails, as it will expire soon anyway
  await removeTokenValidationResultFromCache(tokenId)

  const delCount = await ApiTokens()
    .where({ id: tokenId.slice(0, 10) })
    .del()

  if (delCount === 0) throw new Error('Token revokation failed')
  return true
}

export async function getUserTokens(userId: UserId) {
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
  return rows
}
