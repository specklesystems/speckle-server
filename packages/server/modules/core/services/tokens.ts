'use strict'
import bcrypt from 'bcrypt'
import crs from 'crypto-random-string'
import knex from '@/db/knex'
import { ServerAcl as ServerAclSchema } from '@/modules/core/dbSchema'
import { z } from 'zod'
import { logger } from '@/logging/logging'
import { TokenValidationResult } from '@/modules/core/helpers/types'

const ApiTokens = () => knex('api_tokens')
const PersonalApiTokens = () => knex('personal_api_tokens')

const TokenScopes = () => knex('token_scopes')
const ServerRoles = () => ServerAclSchema.knex()

export type TokenRequestParams = {
  userId: string
  name: string
  scopes: string[]
  lifespan: number
}

const StoredTokenSchema = z.object({
  // id: z.string(),
  // name: z.string(),
  // lastChars: z.string(),
  // revoked: z.boolean(),
  createdAt: z.date(),
  // lastUsed: z.date(),
  lifespan: z.coerce.number(),
  owner: z.string(),
  tokenDigest: z.string()
})
type StoredToken = z.infer<typeof StoredTokenSchema>

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
}: TokenRequestParams) {
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
  const { id, token } = await createToken({
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
  tokenString: string
): Promise<TokenValidationResult> {
  const tokenId = tokenString.slice(0, 10)
  const tokenContent = tokenString.slice(10, 42)

  const rawToken = await ApiTokens().where({ id: tokenId }).select('*').first()

  let token: StoredToken
  try {
    token = StoredTokenSchema.parse(rawToken)
  } catch (error) {
    logger.warn({ error, tokenId }, 'No valid token for token ID: {tokenId}')
    return { valid: false }
  }

  const timeDiff = Math.abs(Date.now() - new Date(token.createdAt).getTime())
  if (timeDiff > token.lifespan) {
    await revokeToken(tokenId, token.owner)
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
    return {
      valid: true,
      userId: token.owner,
      role,
      scopes: scopes.map((s) => s.scopeName)
    }
  } else return { valid: false }
}

export async function revokeToken(tokenId: string, userId: string) {
  tokenId = tokenId.slice(0, 10)
  const delCount = await ApiTokens().where({ id: tokenId, owner: userId }).del()

  if (delCount === 0) throw new Error('Did not revoke token')
  return true
}

export async function revokeTokenById(tokenId: string) {
  const delCount = await ApiTokens()
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
  return rows
}
