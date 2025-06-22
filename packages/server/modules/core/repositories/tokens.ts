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
import { TokenRevokationError } from '@/modules/core/errors/tokens'
import type { MainDb } from '@/db/types'

const tables = {
  apiTokens: (db: MainDb) => db<ApiTokenRecord>(ApiTokens.name),
  tokenScopes: (db: MainDb) => db<TokenScopeRecord>(TokenScopes.name),
  tokenResourceAccess: (db: MainDb) =>
    db<TokenResourceAccessRecord>(TokenResourceAccess.name),
  userServerAppTokens: (db: MainDb) =>
    db<UserServerAppTokenRecord>(UserServerAppTokens.name),
  personalApiTokens: (db: MainDb) => db<PersonalApiTokenRecord>(PersonalApiTokens.name)
}

export const storeApiTokenFactory =
  (deps: { db: MainDb }): StoreApiToken =>
  async (token) => {
    const [newToken] = await tables.apiTokens(deps.db).insert(token, '*')
    return newToken
  }

export const storeTokenScopesFactory =
  (deps: { db: MainDb }): StoreTokenScopes =>
  async (scopes) => {
    await tables.tokenScopes(deps.db).insert(scopes)
  }

export const storeTokenResourceAccessDefinitionsFactory =
  (deps: { db: MainDb }): StoreTokenResourceAccessDefinitions =>
  async (defs) => {
    await tables.tokenResourceAccess(deps.db).insert(defs)
  }

export const storeUserServerAppTokenFactory =
  (deps: { db: MainDb }): StoreUserServerAppToken =>
  async (token) => {
    const [newToken] = await tables.userServerAppTokens(deps.db).insert(token, '*')
    return newToken
  }

export const storePersonalApiTokenFactory =
  (deps: { db: MainDb }): StorePersonalApiToken =>
  async (token) => {
    const [newToken] = await tables.personalApiTokens(deps.db).insert(token, '*')
    return newToken
  }

export const getUserPersonalAccessTokensFactory =
  (deps: { db: MainDb }): GetUserPersonalAccessTokens =>
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
  (deps: { db: MainDb }): RevokeTokenById =>
  async (tokenId: string) => {
    const delCount = await tables
      .apiTokens(deps.db)
      .where({ id: tokenId.slice(0, 10) })
      .del()

    if (delCount === 0) throw new TokenRevokationError('Token revokation failed')
    return true
  }

export const revokeUserTokenByIdFactory =
  (deps: { db: MainDb }): RevokeUserTokenById =>
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
  (deps: { db: MainDb }): GetApiTokenById =>
  async (tokenId) => {
    return tables.apiTokens(deps.db).where({ id: tokenId }).first()
  }

export const getTokenScopesByIdFactory =
  (deps: { db: MainDb }): GetTokenScopesById =>
  async (tokenId: string) => {
    return tables.tokenScopes(deps.db).where({ tokenId })
  }

export const getTokenResourceAccessDefinitionsByIdFactory =
  (deps: { db: MainDb }): GetTokenResourceAccessDefinitionsById =>
  async (tokenId: string) => {
    return tables.tokenResourceAccess(deps.db).where({ tokenId })
  }

export const updateApiTokenFactory =
  (deps: { db: MainDb }): UpdateApiToken =>
  async (tokenId, token) => {
    const [updatedToken] = await tables
      .apiTokens(deps.db)
      .where({ id: tokenId })
      .update(token, '*')
    return updatedToken
  }
