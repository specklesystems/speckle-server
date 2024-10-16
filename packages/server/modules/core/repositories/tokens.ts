import {
  TokenScopeRecord,
  UserServerAppTokenRecord
} from '@/modules/auth/helpers/types'
import { ApiTokenRecord } from '@/modules/auth/repositories'
import {
  ApiTokens,
  TokenResourceAccess,
  TokenScopes,
  UserServerAppTokens
} from '@/modules/core/dbSchema'
import {
  StoreApiToken,
  StoreTokenResourceAccessDefinitions,
  StoreTokenScopes,
  StoreUserServerAppToken
} from '@/modules/core/domain/tokens/operations'
import { TokenResourceAccessRecord } from '@/modules/core/helpers/types'
import { Knex } from 'knex'

const tables = {
  apiTokens: (db: Knex) => db<ApiTokenRecord>(ApiTokens.name),
  tokenScopes: (db: Knex) => db<TokenScopeRecord>(TokenScopes.name),
  tokenResourceAccess: (db: Knex) =>
    db<TokenResourceAccessRecord>(TokenResourceAccess.name),
  userServerAppTokens: (db: Knex) =>
    db<UserServerAppTokenRecord>(UserServerAppTokens.name)
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
