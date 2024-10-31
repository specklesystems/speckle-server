import {
  AuthorizationCodes,
  RefreshTokens,
  Scopes,
  ServerAppsScopes,
  knex
} from '@/modules/core/dbSchema'
import { InvalidArgumentError } from '@/modules/shared/errors'
import { Nullable } from '@/modules/shared/helpers/typeHelper'
import { ServerAppsScopesRecord } from '@/modules/auth/helpers/types'
import { groupBy, mapValues } from 'lodash'
import { TokenScopeData } from '@/modules/shared/domain/rolesAndScopes/types'
import { Knex } from 'knex'
import {
  DeleteExistingUserAuthTokens,
  GetAppScopes
} from '@/modules/auth/domain/operations'

export type RefreshTokenRecord = {
  id: string
  tokenDigest: string
  appId: string
  userId: string
  createdAt: string
  lifespan: number
}

export type AuthorizationCodeRecord = {
  id: string
  appId: string
  userId: string
  challenge: string
  createdAt: string
  lifespan: number
}

export type ApiTokenRecord = {
  id: string
  tokenDigest: string
  owner: string
  name: Nullable<string>
  lastChars: Nullable<string>
  revoked: boolean
  lifespan: number | bigint
  createdAt: Date
  lastUsed: Date
}

const tables = {
  serverAppsScopes: (db: Knex) => db<ServerAppsScopesRecord>(ServerAppsScopes.name),
  authorizationCodes: (db: Knex) =>
    db<AuthorizationCodeRecord>(AuthorizationCodes.name),
  refreshTokens: (db: Knex) => db<RefreshTokenRecord>(RefreshTokens.name)
}

export const deleteExistingAuthTokensFactory =
  (deps: { db: Knex }): DeleteExistingUserAuthTokens =>
  async (userId: string) => {
    if (!userId) throw new InvalidArgumentError('User ID must be set')

    await tables.refreshTokens(deps.db).where(RefreshTokens.col.userId, userId)
    await tables
      .authorizationCodes(deps.db)
      .where(AuthorizationCodes.col.userId, userId)
    await knex.raw(
      `
        DELETE FROM api_tokens
        WHERE owner = ?
        AND id NOT IN (
          SELECT p."tokenId" FROM personal_api_tokens p WHERE p."userId" = ?
        )
        `,
      [userId, userId]
    )
  }

export const getAppScopesFactory =
  (deps: { db: Knex }): GetAppScopes =>
  async (appIds: string[]) => {
    const items = await tables
      .serverAppsScopes(deps.db)
      .select<Array<ServerAppsScopesRecord & TokenScopeData>>('*')
      .whereIn(ServerAppsScopes.col.appId, appIds)
      .innerJoin(Scopes.name, Scopes.col.name, ServerAppsScopes.col.scopeName)

    // Return record where each key is an app id and the value is an array of scopes
    return mapValues(
      groupBy(items, (i) => i.appId),
      (v) => v.map((vi) => ({ name: vi.scopeName, description: vi.description }))
    )
  }
