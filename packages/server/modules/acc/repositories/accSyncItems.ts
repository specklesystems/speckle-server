import { AccSyncItems } from '@/modules/acc/dbSchema'
import type {
  CountAccSyncItems,
  DeleteAccSyncItemById,
  GetAccSyncItemById,
  GetAccSyncItemByModelId,
  GetAccSyncItemsById,
  ListAccSyncItems,
  QueryAllAccSyncItems,
  UpdateAccSyncItemStatus,
  UpsertAccSyncItem
} from '@/modules/acc/domain/acc/operations'
import { executeBatchedSelect } from '@/modules/shared/helpers/dbHelper'
import type { AccSyncItem } from '@/modules/acc/domain/acc/types'
import type { Knex } from 'knex'
import { without } from 'lodash-es'

const tables = {
  accSyncItems: (db: Knex) => db<AccSyncItem>(AccSyncItems.name)
}

export const getAccSyncItemByIdFactory =
  (deps: { db: Knex }): GetAccSyncItemById =>
  async ({ id }) => {
    return (
      (await tables
        .accSyncItems(deps.db)
        .select()
        .where(AccSyncItems.col.id, id)
        .first()) ?? null
    )
  }

export const getAccSyncItemByModelIdFactory =
  (deps: { db: Knex }): GetAccSyncItemByModelId =>
  async ({ modelId }) => {
    return (
      (await tables
        .accSyncItems(deps.db)
        .select()
        .where(AccSyncItems.col.modelId, modelId)
        .first()) ?? null
    )
  }

export const getAccSyncItemsByIdFactory =
  (deps: { db: Knex }): GetAccSyncItemsById =>
  async ({ ids }) => {
    if (!ids.length) return []

    return await tables.accSyncItems(deps.db).select().whereIn(AccSyncItems.col.id, ids)
  }

export const getAccSyncItemsByModelIdFactory =
  (deps: { db: Knex }): GetAccSyncItemsById =>
  async ({ ids }) => {
    if (!ids.length) return []

    return await tables
      .accSyncItems(deps.db)
      .select()
      .whereIn(AccSyncItems.col.modelId, ids)
  }

export const upsertAccSyncItemFactory =
  (deps: { db: Knex }): UpsertAccSyncItem =>
  async (item) => {
    await tables
      .accSyncItems(deps.db)
      .insert(item)
      .onConflict(AccSyncItems.withoutTablePrefix.col.id)
      .merge(
        without(
          AccSyncItems.withoutTablePrefix.cols,
          AccSyncItems.withoutTablePrefix.col.id
        ) as (keyof AccSyncItem)[]
      )
  }

export const updateAccSyncItemStatusFactory =
  (deps: { db: Knex }): UpdateAccSyncItemStatus =>
  async ({ id, status }) => {
    return (
      (
        await tables
          .accSyncItems(deps.db)
          .update({
            [AccSyncItems.withoutTablePrefix.col.status]: status
          })
          .where(AccSyncItems.withoutTablePrefix.col.id, id)
          .returning('*')
      ).at(0) ?? null
    )
  }

export const deleteAccSyncItemByIdFactory =
  (deps: { db: Knex }): DeleteAccSyncItemById =>
  async ({ id }) => {
    return await tables.accSyncItems(deps.db).where(AccSyncItems.col.id, id).delete()
  }

export const listAccSyncItemsFactory =
  (deps: { db: Knex }): ListAccSyncItems =>
  async ({ projectId, filter = {} }) => {
    const query = tables
      .accSyncItems(deps.db)
      .select('*')
      .where(AccSyncItems.col.projectId, projectId)
      // TODO ACC: Better default order once we know how we're presenting the snyc list (i.e. tree vs list)
      .orderBy(AccSyncItems.col.updatedAt, 'desc')

    if (filter.limit) {
      query.limit(filter.limit)
    }

    if (filter.updatedBefore) {
      query.where(AccSyncItems.col.updatedAt, '<', filter.updatedBefore)
    }

    return await query
  }

export const countAccSyncItemsFactory =
  (deps: { db: Knex }): CountAccSyncItems =>
  async ({ projectId }) => {
    const [{ count }] = await tables
      .accSyncItems(deps.db)
      .where(AccSyncItems.col.projectId, projectId)
      .count()
    return Number.parseInt(count as string)
  }

export const queryAllAccSyncItemsFactory =
  (deps: { db: Knex }): QueryAllAccSyncItems =>
  ({ batchSize = 10, filter = {} }) => {
    const { status, lineageUrn } = filter

    const query = tables
      .accSyncItems(deps.db)
      .select<AccSyncItem[]>('*')
      .orderBy(AccSyncItems.col.createdAt)

    if (filter.status) {
      query.where(AccSyncItems.withoutTablePrefix.col.status, status)
    }

    if (filter.lineageUrn) {
      query.where(AccSyncItems.withoutTablePrefix.col.accFileLineageUrn, lineageUrn)
    }

    return executeBatchedSelect(query, { batchSize })
  }
