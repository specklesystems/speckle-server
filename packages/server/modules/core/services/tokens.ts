'use strict'
import bcrypt from 'bcrypt'
import crs from 'crypto-random-string'
import knex from '@/db/knex'
import { ServerAclRecord, TokenValidationResult } from '@/modules/core/helpers/types'

import {
  ApiTokens as ApiTokensSchema,
  PersonalApiTokens as PersonalApiTokensSchema,
  TokenScopes as TokenScopesSchema,
  ServerAcl as ServerAclSchema
} from '@/modules/core/dbSchema'
import {
  ApiTokenRecord,
  PersonalApiTokenRecord,
  TokenScopeRecord
} from '@/modules/auth/repositories'
import { MaybeNullOrUndefined } from '@speckle/shared'

const ServerRoles = () => ServerAclSchema.knex<ServerAclRecord[]>()
const TokenScopes = () => TokenScopesSchema.knex<TokenScopeRecord[]>()
const ApiTokens = () => ApiTokensSchema.knex<ApiTokenRecord[]>()
const PersonalApiTokens = () => PersonalApiTokensSchema.knex<PersonalApiTokenRecord[]>()

export type TokenRequestParams = {
  userId: string
  name: string
  scopes: string[]
  lifespan: MaybeNullOrUndefined<bigint>
}

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
  lifespan: MaybeNullOrUndefined<bigint>
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

export async function validateToken(
  tokenString: string
): Promise<TokenValidationResult> {
  const tokenId = tokenString.slice(0, 10)
  const tokenContent = tokenString.slice(10, 42)

  const token = await ApiTokens().where({ id: tokenId }).select('*').first()

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
  return rows //FIXME this is typed as `any` because of the raw query
}
