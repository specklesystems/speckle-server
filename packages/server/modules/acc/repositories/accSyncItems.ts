import { AccSyncItems } from '@/modules/acc/dbSchema'
import type {
  CountAccSyncItems,
  DeleteAccSyncItemByUrn,
  GetAccSyncItemByUrn,
  ListAccSyncItems,
  QueryAllAccSyncItems,
  UpdateAccSyncItemStatus,
  UpsertAccSyncItem
} from '@/modules/acc/domain/operations'
import { executeBatchedSelect } from '@/modules/shared/helpers/dbHelper'
import type { AccSyncItem } from '@/modules/acc/domain/types'
import type { Knex } from 'knex'
import { without } from 'lodash-es'

const tables = {
  accSyncItems: (db: Knex) => db<AccSyncItem>(AccSyncItems.name)
}

export const getAccSyncItemByUrnFactory =
  (deps: { db: Knex }): GetAccSyncItemByUrn =>
  async ({ lineageUrn }) => {
    return (
      (await tables
        .accSyncItems(deps.db)
        .select('*')
        .where(AccSyncItems.col.accFileLineageUrn, lineageUrn)
        .first()) ?? null
    )
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
            [AccSyncItems.col.status]: status
          })
          .where(AccSyncItems.col.id, id)
          .returning('*')
      ).at(0) ?? null
    )
  }

export const deleteAccSyncItemByUrnFactory =
  (deps: { db: Knex }): DeleteAccSyncItemByUrn =>
  async ({ lineageUrn }) => {
    return await tables
      .accSyncItems(deps.db)
      .where(AccSyncItems.col.accFileLineageUrn, lineageUrn)
      .delete()
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

export const queryAllPendingAccSyncItemsFactory =
  (deps: { db: Knex }): QueryAllAccSyncItems =>
  () => {
    const selectItems = tables
      .accSyncItems(deps.db)
      .select<AccSyncItem[]>('*')
      .where(AccSyncItems.col.status, 'PENDING')
      .orderBy(AccSyncItems.col.createdAt)
    return executeBatchedSelect(selectItems, { batchSize: 10 })
  }
