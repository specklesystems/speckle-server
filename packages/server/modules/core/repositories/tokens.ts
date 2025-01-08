import {
  PersonalApiTokenRecord,
  TokenScopeRecord,
  UserServerAppTokenRecord
} from '@/modules/auth/helpers/types'
import { ApiTokenRecord } from '@/modules/auth/repositories'
import {
  ApiTokens,
  PersonalApiTokens,
  TokenResourceAccess,
  TokenScopes,
  UserServerAppTokens
} from '@/modules/core/dbSchema'
import {
  GetApiTokenById,
  GetTokenResourceAccessDefinitionsById,
  GetTokenScopesById,
  GetUserPersonalAccessTokens,
  RevokeTokenById,
  RevokeUserTokenById,
  StoreApiToken,
  StorePersonalApiToken,
  StoreTokenResourceAccessDefinitions,
  StoreTokenScopes,
  StoreUserServerAppToken,
  UpdateApiToken
} from '@/modules/core/domain/tokens/operations'
import { UserInputError } from '@/modules/core/errors/userinput'
import { TokenResourceAccessRecord } from '@/modules/core/helpers/types'
import { ServerScope } from '@speckle/shared'
import { Knex } from 'knex'

const tables = {
  apiTokens: (db: Knex) => db<ApiTokenRecord>(ApiTokens.name),
  tokenScopes: (db: Knex) => db<TokenScopeRecord>(TokenScopes.name),
  tokenResourceAccess: (db: Knex) =>
    db<TokenResourceAccessRecord>(TokenResourceAccess.name),
  userServerAppTokens: (db: Knex) =>
    db<UserServerAppTokenRecord>(UserServerAppTokens.name),
  personalApiTokens: (db: Knex) => db<PersonalApiTokenRecord>(PersonalApiTokens.name)
}

export const storeApiTokenFactory =
  (deps: { db: Knex }): StoreApiToken =>
  async (token) => {
    const [newToken] = await tables.apiTokens(deps.db).insert(token, '*')
    return newToken
  }

export const storeTokenScopesFactory =
  (deps: { db: Knex }): StoreTokenScopes =>
  async (scopes) => {
    await tables.tokenScopes(deps.db).insert(scopes)
  }

export const storeTokenResourceAccessDefinitionsFactory =
  (deps: { db: Knex }): StoreTokenResourceAccessDefinitions =>
  async (defs) => {
    await tables.tokenResourceAccess(deps.db).insert(defs)
  }

export const storeUserServerAppTokenFactory =
  (deps: { db: Knex }): StoreUserServerAppToken =>
  async (token) => {
    const [newToken] = await tables.userServerAppTokens(deps.db).insert(token, '*')
    return newToken
  }

export const storePersonalApiTokenFactory =
  (deps: { db: Knex }): StorePersonalApiToken =>
  async (token) => {
    const [newToken] = await tables.personalApiTokens(deps.db).insert(token, '*')
    return newToken
  }

export const getUserPersonalAccessTokensFactory =
  (deps: { db: Knex }): GetUserPersonalAccessTokens =>
  async (userId) => {
    const { rows } = await deps.db.raw(
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
      scopes: ServerScope[]
    }[]
  }

export const revokeTokenByIdFactory =
  (deps: { db: Knex }): RevokeTokenById =>
  async (tokenId: string) => {
    const delCount = await tables
      .apiTokens(deps.db)
      .where({ id: tokenId.slice(0, 10) })
      .del()

    if (delCount === 0) throw new Error('Token revokation failed')
    return true
  }

export const revokeUserTokenByIdFactory =
  (deps: { db: Knex }): RevokeUserTokenById =>
  async (tokenId: string, userId: string) => {
    tokenId = tokenId.slice(0, 10)
    const delCount = await tables
      .apiTokens(deps.db)
      .where({ id: tokenId, owner: userId })
      .del()
    if (delCount === 0) throw new UserInputError('Did not revoke token')
    return true
  }

export const getApiTokenByIdFactory =
  (deps: { db: Knex }): GetApiTokenById =>
  async (tokenId) => {
    return tables.apiTokens(deps.db).where({ id: tokenId }).first()
  }

export const getTokenScopesByIdFactory =
  (deps: { db: Knex }): GetTokenScopesById =>
  async (tokenId: string) => {
    return tables.tokenScopes(deps.db).where({ tokenId })
  }

export const getTokenResourceAccessDefinitionsByIdFactory =
  (deps: { db: Knex }): GetTokenResourceAccessDefinitionsById =>
  async (tokenId: string) => {
    return tables.tokenResourceAccess(deps.db).where({ tokenId })
  }

export const updateApiTokenFactory =
  (deps: { db: Knex }): UpdateApiToken =>
  async (tokenId, token) => {
    const [updatedToken] = await tables
      .apiTokens(deps.db)
      .where({ id: tokenId })
      .update(token, '*')
    return updatedToken
  }
