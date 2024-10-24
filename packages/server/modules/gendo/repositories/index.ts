import { GendoAIRenders } from '@/modules/core/dbSchema'
import {
  GetLatestVersionRenderRequests,
  GetRenderByGenerationId,
  StoreRender,
  UpdateRenderRecord
} from '@/modules/gendo/domain/operations'
import { GendoAIRenderRecord } from '@/modules/gendo/helpers/types'
import { Knex } from 'knex'
import { pick } from 'lodash'

const tables = {
  gendoAIRenders: (db: Knex) => db<GendoAIRenderRecord>(GendoAIRenders.name)
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
