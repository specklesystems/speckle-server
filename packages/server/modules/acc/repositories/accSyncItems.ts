import { AccSyncItems } from '@/modules/acc/dbSchema'
import { AccSyncItemEvents } from '@/modules/acc/domain/events'
import {
  DeleteAccSyncItem,
  QueryAllAccSyncItems,
  UpsertAccSyncItem
} from '@/modules/acc/domain/operations'
import { executeBatchedSelect } from '@/modules/shared/helpers/dbHelper'
import { AccSyncItem } from '@/modules/acc/domain/types'
import { EventBusEmit } from '@/modules/shared/services/eventBus'
import { Knex } from 'knex'
import { omit } from 'lodash'

const tables = {
  accSyncItems: (db: Knex) => db<AccSyncItem>(AccSyncItems.name)
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

export const upsertAccSyncItemFactory =
  (deps: { db: Knex }): UpsertAccSyncItem =>
  async (item) => {
    await tables
      .accSyncItems(deps.db)
      .insert(item)
      .onConflict(AccSyncItems.col.id)
      .merge([
        AccSyncItems.col.status,
        AccSyncItems.col.accFileVersionIndex,
        AccSyncItems.col.accFileVersionUrn
      ] as (keyof AccSyncItem)[])
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
