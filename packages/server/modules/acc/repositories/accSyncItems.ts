import { AccSyncItems } from '@/modules/acc/dbSchema'
import type {
  DeleteAccSyncItemByUrn,
  GetAccSyncItemByUrn,
  QueryAllAccSyncItems,
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
    return await tables
      .accSyncItems(deps.db)
      .select('*')
      .where(AccSyncItems.col.accFileLineageUrn, lineageUrn)
      .first()
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

export const deleteAccSyncItemByUrnFactory =
  (deps: { db: Knex }): DeleteAccSyncItemByUrn =>
  async ({ lineageUrn }) => {
    return await tables
      .accSyncItems(deps.db)
      .where(AccSyncItems.col.accFileLineageUrn, lineageUrn)
      .delete()
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
