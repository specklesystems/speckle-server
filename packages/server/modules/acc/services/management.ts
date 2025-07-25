import { tryRegisterAccWebhook } from '@/modules/acc/clients/autodesk'
import { AccSyncItems } from '@/modules/acc/dbSchema'
import { AccSyncItemEvents } from '@/modules/acc/domain/events'
import type { AccRegion, AccSyncItem } from '@/modules/acc/domain/types'
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'
import type { EventBusEmit } from '@/modules/shared/services/eventBus'
import type { Knex } from 'knex'

const tables = {
  accSyncItems: (db: Knex) => db<AccSyncItem>(AccSyncItems.name)
}

export type CreateAccSyncItem = (
  input: Omit<AccSyncItem, 'createdAt' | 'updatedAt'>
) => Promise<AccSyncItem>

export const createAccSyncItem = (deps: {
  db: Knex
  eventEmit: EventBusEmit
}): CreateAccSyncItem => {
  return async (input) => {
    const webhookId = await tryRegisterAccWebhook({
      rootProjectFolderUrn: input.accRootProjectFolderId,
      // For local development, you may set your public tailscale url as your local server's canonical origin
      callbackUrl: `${getServerOrigin()}/api/v1/acc/webhook/callback`,
      region: input.accRegion as AccRegion,
      event: 'dm.version.added' // NOTE ACC: you can register an event only once
    })

    // TODO ACC: Upsert not db access
    const [item] = await tables
      .accSyncItems(deps.db)
      .insert({
        ...input,
        accWebhookId: webhookId ?? undefined,
        createdAt: new Date(),
        updatedAt: new Date()
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
