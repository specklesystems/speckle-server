import { AccSyncItemEvents } from '@/modules/acc/domain/events'
import { AccSyncItem } from '@/modules/acc/helpers/types'
// import { registerAccWebhook } from '@/modules/acc/webhook'
import { EventBusEmit } from '@/modules/shared/services/eventBus'
import { Knex } from 'knex'

const ACC_SYNC_ITEMS = 'acc_sync_items'

const tables = {
  accSyncItems: (db: Knex) => db<AccSyncItem>(ACC_SYNC_ITEMS)
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
