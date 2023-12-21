import { ScopeRecord, ServerAppsScopesRecord } from '@/modules/auth/helpers/types'
import {
  AuthorizationCodes,
  RefreshTokens,
  Scopes,
  ServerAppsScopes,
  knex
} from '@/modules/core/dbSchema'
import { InvalidArgumentError } from '@/modules/shared/errors'
import { Nullable } from '@/modules/shared/helpers/typeHelper'
import { groupBy, mapValues } from 'lodash'

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
  lifespan: number
  createdAt: string
  lastUsed: string
}

export async function deleteExistingAuthTokens(userId: string) {
  if (!userId) throw new InvalidArgumentError('User ID must be set')

  await RefreshTokens.knex().where(RefreshTokens.col.userId, userId)
  await AuthorizationCodes.knex().where(AuthorizationCodes.col.userId, userId)
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

export async function getAppScopes(appIds: string[]) {
  const items = await ServerAppsScopes.knex<
    Array<ServerAppsScopesRecord & ScopeRecord>
  >()
    .whereIn(ServerAppsScopes.col.appId, appIds)
    .innerJoin(Scopes.name, Scopes.col.name, ServerAppsScopes.col.scopeName)

  // Return record where each key is an app id and the value is an array of scopes
  return mapValues(
    groupBy(items, (i) => i.appId),
    (v) => v.map((vi) => ({ name: vi.scopeName, description: vi.description }))
  )
}
