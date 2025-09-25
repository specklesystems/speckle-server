import { buildTableHelper } from '@/modules/core/dbSchema'
import { ApiTokens } from '@/modules/core/dbSchema'
import type {
  DeleteSavedViewGroupApiToken,
  GetSavedViewGroupApiToken,
  GetSavedViewGroupApiTokens,
  StoreSavedViewGroupApiToken
} from '@/modules/viewer/domain/operations/savedViewGroupApiTokens'
import type {
  SavedViewGroupApiToken,
  SavedViewGroupApiTokenRecord
} from '@/modules/viewer/domain/types/savedViewGroupApiTokens'
import type { Knex } from 'knex'

export const SavedViewGroupApiTokens = buildTableHelper('saved_view_group_api_tokens', [
  'tokenId',
  'projectId',
  'savedViewGroupId',
  'userId',
  'content'
])

const tables = {
  savedGroupApiTokens: (db: Knex) =>
    db<SavedViewGroupApiTokenRecord>(SavedViewGroupApiTokens.name)
}

export const storeSavedViewGroupApiTokenFactory =
  (deps: { db: Knex }): StoreSavedViewGroupApiToken =>
  async (token) => {
    const [newToken] = await tables
      .savedGroupApiTokens(deps.db)
      .insert(token)
      .returning('*')
    return newToken
  }

export const deleteSavedViewGroupApiTokenFactory =
  (deps: { db: Knex }): DeleteSavedViewGroupApiToken =>
  async ({ tokenId }) => {
    const [deletedToken] = await tables
      .savedGroupApiTokens(deps.db)
      .where({ tokenId })
      .del()
      .returning('*')
    return deletedToken
  }

export const getSavedViewGroupApiTokensFactory =
  (deps: { db: Knex }): GetSavedViewGroupApiTokens =>
  async ({ savedViewGroupId }) => {
    const tokens = await tables
      .savedGroupApiTokens(deps.db)
      .orderBy(ApiTokens.col.createdAt)
      .join(ApiTokens.name, ApiTokens.col.id, SavedViewGroupApiTokens.col.tokenId)
      .select<SavedViewGroupApiToken[]>([
        ...SavedViewGroupApiTokens.cols,
        ApiTokens.col.createdAt,
        ApiTokens.col.lastUsed,
        ApiTokens.col.lifespan,
        ApiTokens.col.revoked
      ])
      .where({ savedViewGroupId })
    return tokens
  }

export const getSavedViewGroupApiTokenFactory =
  (deps: { db: Knex }): GetSavedViewGroupApiToken =>
  async ({ savedViewGroupId, tokenId }) => {
    const token = await tables
      .savedGroupApiTokens(deps.db)
      .orderBy(ApiTokens.col.createdAt)
      .join(ApiTokens.name, ApiTokens.col.id, SavedViewGroupApiTokens.col.tokenId)
      .select<SavedViewGroupApiToken[]>([
        ...SavedViewGroupApiTokens.cols,
        ApiTokens.col.createdAt,
        ApiTokens.col.lastUsed,
        ApiTokens.col.lifespan,
        ApiTokens.col.revoked
      ])
      .where({ savedViewGroupId, tokenId })
      .first()
    return token ?? null
  }
