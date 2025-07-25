import { AccSyncItems } from '@/modules/acc/dbSchema'
import { AccSyncItemEvents } from '@/modules/acc/domain/events'
import type {
  QueryAllAccSyncItems,
  UpsertAccSyncItem
} from '@/modules/acc/domain/operations'
import { executeBatchedSelect } from '@/modules/shared/helpers/dbHelper'
import type { AccRegion, AccSyncItem } from '@/modules/acc/domain/types'
import type { EventBusEmit } from '@/modules/shared/services/eventBus'
import type { Knex } from 'knex'
import { tryRegisterAccWebhook } from '@/modules/acc/clients/autodesk'
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'

const tables = {
  accSyncItems: (db: Knex) => db<AccSyncItem>(AccSyncItems.name)
}

export type CreateAccSyncItemAndNotify = (
  input: Omit<AccSyncItem, 'createdAt' | 'updatedAt'>
) => Promise<AccSyncItem>

export const getAutodeskAccessToken = async (): Promise<string> => {
  try {
    const clientId = '5Y2LzxsL3usaD1xAMyElBY8mcN6XKyfHfulZDV3up0jfhN5Y'
    const clientSecret =
      'qHyGqaP4zCWLyS2lp04qBDOC1giIupPzJPmLFKGFHKZrPYYpan27zF8vlhQr1RYL'

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const response = await fetch(
      'https://developer.api.autodesk.com/authentication/v2/token',
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json'
        },
        body: new URLSearchParams({
          /* eslint-disable-next-line */
          grant_type: 'client_credentials',
          scope: 'data:read account:read viewables:read'
        }).toString()
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Failed to get access token: ${response.status} ${errText}`)
    }

    const json = await response.json()
    if (!json.access_token) {
      throw new Error('access token is not found')
    }
    return json.access_token as string
  } catch (error) {
    console.log(error)
    throw error
  }
}

export const createAccSyncItemAndNotifyFactory = (deps: {
  db: Knex
  eventEmit: EventBusEmit
}): CreateAccSyncItemAndNotify => {
  return async (input) => {
    const webhookId = await tryRegisterAccWebhook({
      rootProjectFolderUrn: input.accRootProjectFolderId,
      // For local development, you may set your public tailscale url as your local server's canonical origin
      callbackUrl: `${getServerOrigin()}/api/v1/acc/webhook/callback`,
      region: input.accRegion as AccRegion,
      event: 'dm.version.added' // NOTE ACC: you can register an event only once
    })

    if (webhookId) {
      // TODO ACC: Update webhook id on sync record
    }

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
