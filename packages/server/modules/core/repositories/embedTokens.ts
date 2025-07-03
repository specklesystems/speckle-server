import { EmbedApiTokenRecord } from '@/modules/auth/helpers/types'
import { ApiTokenRecord } from '@/modules/auth/repositories'
import { ApiTokens, EmbedApiTokens } from '@/modules/core/dbSchema'
import {
  ListProjectEmbedTokens,
  RevokeEmbedTokenById,
  RevokeProjectEmbedTokens,
  StoreEmbedApiToken
} from '@/modules/core/domain/tokens/operations'
import { UserInputError } from '@/modules/core/errors/userinput'
import { Knex } from 'knex'

const tables = {
  apiTokens: (db: Knex) => db<ApiTokenRecord>(ApiTokens.name),
  embedApiTokens: (db: Knex) => db<EmbedApiTokenRecord>(EmbedApiTokens.name)
}

export const storeEmbedApiTokenFactory =
  (deps: { db: Knex }): StoreEmbedApiToken =>
  async (token) => {
    const [newToken] = await tables.embedApiTokens(deps.db).insert(token).returning('*')
    return newToken
  }

export const listProjectEmbedTokensFactory =
  (deps: { db: Knex }): ListProjectEmbedTokens =>
  async (projectId) => {
    return (await tables
      .embedApiTokens(deps.db)
      .select(
        ...EmbedApiTokens.cols,
        ApiTokens.col.createdAt,
        ApiTokens.col.lastUsed,
        ApiTokens.col.lifespan
      )
      .orderBy(ApiTokens.col.createdAt, 'desc')
      .leftJoin(ApiTokens.name, ApiTokens.col.id, EmbedApiTokens.col.tokenId)
      .where({ projectId })) as (EmbedApiTokenRecord &
      Pick<ApiTokenRecord, 'createdAt' | 'lastUsed' | 'lifespan'>)[]
  }

export const revokeEmbedTokenByIdFactory =
  (deps: { db: Knex }): RevokeEmbedTokenById =>
  async ({ tokenId: token, projectId }) => {
    const tokenId = token.slice(0, 10)
    const delCount = await tables
      .embedApiTokens(deps.db)
      .where({ tokenId, projectId })
      .delete()
    if (delCount === 0) throw new UserInputError('Embed token not found')
    await tables.apiTokens(deps.db).where(ApiTokens.col.id, tokenId).delete()
    return true
  }

export const revokeProjectEmbedTokensFactory =
  (deps: { db: Knex }): RevokeProjectEmbedTokens =>
  async ({ projectId }) => {
    await tables
      .apiTokens(deps.db)
      .whereIn(ApiTokens.col.id, (builder) => {
        return builder
          .select('tokenId')
          .from<EmbedApiTokenRecord>(EmbedApiTokens.name)
          .where('projectId', projectId)
      })
      .delete()
  }
