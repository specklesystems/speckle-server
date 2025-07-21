import { PendingAccSyncItems } from '@/modules/acc/dbSchema'
import { AccSyncItemEvents } from '@/modules/acc/domain/events'
import { DeletePendingAccSyncItem, QueryAllPendingAccSyncItems, UpsertPendingAccSyncItem } from '@/modules/acc/domain/operations'
import { PendingAccSyncItem } from '@/modules/acc/domain/types'
import { AccSyncItem } from '@/modules/acc/helpers/types'
import { executeBatchedSelect } from '@/modules/shared/helpers/dbHelper'
// import { registerAccWebhook } from '@/modules/acc/webhook'
import { EventBusEmit } from '@/modules/shared/services/eventBus'
import { Knex } from 'knex'

const ACC_SYNC_ITEMS = 'acc_sync_items'

const tables = {
  accSyncItems: (db: Knex) => db<AccSyncItem>(ACC_SYNC_ITEMS),
  pendingAccSyncItems: (db: Knex) => db<PendingAccSyncItem>(PendingAccSyncItems.name)
}

export type CreateAccSyncItemAndNotify = (
  input: Omit<AccSyncItem, 'createdAt' | 'updatedAt'>
) => Promise<AccSyncItem>

export const createAccSyncItemAndNotifyFactory = (deps: {
  db: Knex
  eventEmit: EventBusEmit
}): CreateAccSyncItemAndNotify => {
  return async (input) => {
    // TODO ACC: register webhook if it is not yet
    // const accWebhook = await registerAccWebhook({
    //   accessToken: '', // TODO ACC: get the token from 2legged server-to-server auth
    //   rootProjectId: input.accRootProjectFolderId,
    //   region: input.accRegion,
    //   event: 'dm.version.added' // NOTE ACC: you can register an event only once
    // })
    // TODO ACC: get webhook id and store it in item -> not sure it is make sense to have many webhooks per file as `/acc/webhook/callback/:filelineageUrn`

    // TODO ACC: trigger automation and update status of sync item
    const now = new Date()

    const [item] = await tables
      .accSyncItems(deps.db)
      .insert({
        ...input,
        createdAt: now,
        updatedAt: now
      })
      .returning('*')

    // TODO ACC: somehow i could not managed to get subsriptions work, doing stupid timeout refetch in FE after create/delete/update
    // Once we have it properly TODO ogu: fix it on FE
    await deps.eventEmit({
      eventName: AccSyncItemEvents.Created,
      payload: {
        syncItem: item,
        projectId: item.projectId
      }
    })

    return item
  }
}

export const upsertPendingAccSyncItemFactory = (deps: { db: Knex }): UpsertPendingAccSyncItem =>
  async (item) => {
    await tables.pendingAccSyncItems(deps.db).insert(item)
      .onConflict(PendingAccSyncItems.col.syncItemId)
      .merge([
        PendingAccSyncItems.col.accFileUrn,
        PendingAccSyncItems.col.fileUploadId,
        PendingAccSyncItems.col.createdAt
      ] as (keyof PendingAccSyncItem)[])
  }

export const deletePendingAccSyncItemFactory = (deps: { db: Knex }): DeletePendingAccSyncItem =>
  async ({ id }) => {
    await tables.pendingAccSyncItems(deps.db).where({ syncItemId: id }).delete()
  }

export const queryAllPendingAccSyncItemsFactory = (deps: { db: Knex }): QueryAllPendingAccSyncItems =>
  () => {
    const selectItems = tables.pendingAccSyncItems(deps.db).select<PendingAccSyncItem[]>('*').orderBy(PendingAccSyncItems.col.createdAt)
    return executeBatchedSelect(selectItems, { batchSize: 10 })
  }
