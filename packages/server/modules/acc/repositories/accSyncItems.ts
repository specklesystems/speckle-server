import { AccSyncItemEvents } from '@/modules/acc/domain/events'
import { AccSyncItem } from '@/modules/acc/helpers/types'
import { EventBusEmit } from '@/modules/shared/services/eventBus'
import { Knex } from 'knex'

const ACC_SYNC_ITEMS = 'acc_sync_items'

const tables = {
  accSyncItems: (db: Knex) => db<AccSyncItem>(ACC_SYNC_ITEMS)
}

export type CreateAccSyncItemAndNotify = (
  input: Omit<AccSyncItem, 'author' | 'createdAt' | 'updatedAt'>
) => Promise<AccSyncItem>

export const createAccSyncItemAndNotifyFactory = (deps: {
  db: Knex
  eventEmit: EventBusEmit
}): CreateAccSyncItemAndNotify => {
  return async (input) => {
    const now = new Date()

    const [item] = await tables
      .accSyncItems(deps.db)
      .insert({
        ...input,
        createdAt: now,
        updatedAt: now
      })
      .returning('*')

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
