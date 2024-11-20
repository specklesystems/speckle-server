import { GendoAIRenders } from '@/modules/core/dbSchema'
import {
  GetGenerationProjectId,
  GetLatestVersionRenderRequests,
  GetRenderByGenerationId,
  GetUserCredits,
  GetVersionRenderRequest,
  StoreGenerationProjectId,
  StoreRender,
  UpdateRenderRecord,
  UpsertUserCredits
} from '@/modules/gendo/domain/operations'
import { UserCredits } from '@/modules/gendo/domain/types'
import { GendoAIRenderRecord } from '@/modules/gendo/helpers/types'
import Redis from 'ioredis'
import { Knex } from 'knex'
import { pick } from 'lodash'

const tables = {
  gendoAIRenders: (db: Knex) => db<GendoAIRenderRecord>(GendoAIRenders.name),
  gendoUserCredits: (db: Knex) => db<UserCredits>('gendo_user_credits')
}

export const storeRenderFactory =
  (deps: { db: Knex }): StoreRender =>
  async (input) => {
    const [newRec] = await tables
      .gendoAIRenders(deps.db)
      .insert(pick(input, GendoAIRenders.withoutTablePrefix.cols))
      .returning('*')
    return newRec
  }

export const getRenderByGenerationIdFactory =
  (deps: { db: Knex }): GetRenderByGenerationId =>
  async (params) => {
    const rec = await tables
      .gendoAIRenders(deps.db)
      .where({ [GendoAIRenders.col.gendoGenerationId]: params.gendoGenerationId })
      .first()
    return rec
  }

export const updateRenderRecordFactory =
  (deps: { db: Knex }): UpdateRenderRecord =>
  async (params) => {
    const [updatedRec] = await tables
      .gendoAIRenders(deps.db)
      .where({ [GendoAIRenders.col.id]: params.id })
      .update(pick(params.input, GendoAIRenders.withoutTablePrefix.cols))
      .returning('*')
    return updatedRec
  }

export const getLatestVersionRenderRequestsFactory =
  (deps: { db: Knex }): GetLatestVersionRenderRequests =>
  async (params) => {
    const items = await tables
      .gendoAIRenders(deps.db)
      .where({ [GendoAIRenders.col.versionId]: params.versionId })
      .orderBy(GendoAIRenders.col.createdAt, 'desc')
    return items
  }

export const getVersionRenderRequestFactory =
  (deps: { db: Knex }): GetVersionRenderRequest =>
  async (params) => {
    const record = await tables
      .gendoAIRenders(deps.db)
      .where({
        [GendoAIRenders.col.id]: params.id,
        [GendoAIRenders.col.versionId]: params.versionId
      })
      .orderBy(GendoAIRenders.col.createdAt, 'desc')
      .first()
    return record
  }

export const storeGenerationProjectIdFactory =
  ({ redis }: { redis: Redis }): StoreGenerationProjectId =>
  async ({ generationId, projectId }) => {
    await redis.set(generationId, projectId, 'EX', 36_000) // expire this key after a while
  }

export const getGenerationProjectIdFactory =
  ({ redis }: { redis: Redis }): GetGenerationProjectId =>
  async ({ generationId }) => {
    const projectId = await redis.get(generationId)
    if (!projectId) return null
    // cleanup after getting it
    await redis.del(generationId)
    return projectId
  }

export const getUserCreditsFactory =
  ({ db }: { db: Knex }): GetUserCredits =>
  async ({ userId }) => {
    const userCredits = await tables
      .gendoUserCredits(db)
      .select()
      .where({ userId })
      .first()

    return userCredits || null
  }

export const upsertUserCreditsFactory =
  ({ db }: { db: Knex }): UpsertUserCredits =>
  async ({ userCredits }) => {
    await tables.gendoUserCredits(db).insert(userCredits).onConflict().merge()
  }
