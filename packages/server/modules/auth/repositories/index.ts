import {
  AuthorizationCodes as AuthorizationCodesSchema,
  RefreshTokens as RefreshTokensSchema,
  Scopes as ScopesSchema,
  ServerAppsScopes as ServerAppsScopesSchema,
  knex
} from '@/modules/core/dbSchema'
import { InvalidArgumentError } from '@/modules/shared/errors'
import { Nullable } from '@/modules/shared/helpers/typeHelper'
import { ScopeRecord, ServerAppsScopesRecord } from '@/modules/auth/helpers/types'
import { groupBy, mapValues } from 'lodash'

const AuthorizationCodes = () =>
  AuthorizationCodesSchema.knex<AuthorizationCodeRecord[]>()
const RefreshTokens = () => RefreshTokensSchema.knex<RefreshTokenRecord[]>()
const Scopes = () => ScopesSchema.knex<ScopeRecord[]>()

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

export type TokenScopeRecord = {
  tokenId: string
  scopeName: string
}

export type PersonalApiTokenRecord = {
  tokenId: string
  userId: string
}

export async function deleteExistingAuthTokens(userId: string) {
  if (!userId) throw new InvalidArgumentError('User ID must be set')

  await RefreshTokens().where(RefreshTokensSchema.col.userId, userId)
  await AuthorizationCodes().where(AuthorizationCodesSchema.col.userId, userId)
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
  const items = await ServerAppsScopesSchema.knex<
    Array<ServerAppsScopesRecord & ScopeRecord>
  >()
    .whereIn(ServerAppsScopesSchema.col.appId, appIds)
    .innerJoin(Scopes.name, ScopesSchema.col.name, ServerAppsScopesSchema.col.scopeName)

  // Return record where each key is an app id and the value is an array of scopes
  return mapValues(
    groupBy(items, (i) => i.appId),
    (v) => v.map((vi) => ({ name: vi.scopeName, description: vi.description }))
  )
}
