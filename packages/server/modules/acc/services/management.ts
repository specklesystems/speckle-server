import {
  getManifestByUrn,
  getToken,
  tryRegisterAccWebhook
} from '@/modules/acc/clients/autodesk'
import {
  AccSyncItemStatuses,
  ImporterAutomateFunctions
} from '@/modules/acc/domain/constants'
import { AccSyncItemEvents } from '@/modules/acc/domain/events'
import { isReadyForImport } from '@/modules/acc/helpers/svfUtils'
import type {
  CountAccSyncItems,
  DeleteAccSyncItemById,
  GetAccSyncItemById,
  ListAccSyncItems,
  UpsertAccSyncItem
} from '@/modules/acc/domain/operations'
import type { AccSyncItem } from '@/modules/acc/domain/types'
import { SyncItemNotFoundError } from '@/modules/acc/errors/acc'
import type { TriggerSyncItemAutomation } from '@/modules/acc/services/automate'
import type {
  CreateAutomation,
  CreateAutomationRevision
} from '@/modules/automate/domain/operations'
import {
  decodeIsoDateCursor,
  encodeIsoDateCursor
} from '@/modules/shared/helpers/dbHelper'
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'
import type { EventBusEmit } from '@/modules/shared/services/eventBus'
import cryptoRandomString from 'crypto-random-string'
import type { Exact } from 'type-fest'

export type CreateAccSyncItem = (params: {
  syncItem: Pick<
    AccSyncItem,
    | 'projectId'
    | 'modelId'
    | 'accRegion'
    | 'accHubId'
    | 'accProjectId'
    | 'accRootProjectFolderUrn'
    | 'accFileLineageUrn'
    | 'accFileName'
    | 'accFileExtension'
    | 'accFileVersionIndex'
    | 'accFileVersionUrn'
    | 'accFileViewName'
  >
  creatorUserId: string
}) => Promise<AccSyncItem>

export const createAccSyncItemFactory =
  (deps: {
    upsertAccSyncItem: UpsertAccSyncItem
    createAutomation: CreateAutomation
    createAutomationRevision: CreateAutomationRevision
    triggerSyncItemAutomation: TriggerSyncItemAutomation
    eventEmit: EventBusEmit
  }): CreateAccSyncItem =>
  async ({ syncItem, creatorUserId }) => {
    const webhookId = await tryRegisterAccWebhook({
      // For local development, you may set your public tailscale url as your local server's canonical origin
      callbackUrl: `${getServerOrigin()}/api/v1/acc/webhook/callback`,
      event: 'dm.version.added',
      rootProjectFolderUrn: syncItem.accRootProjectFolderUrn,
      region: syncItem.accRegion
    })

    const { automation } = await deps.createAutomation({
      input: {
        name: 'SVF2 Importer',
        enabled: false
      },
      projectId: syncItem.projectId,
      userId: creatorUserId
    })

    await deps.createAutomationRevision({
      input: {
        automationId: automation.id,
        functions: [
          {
            functionId: ImporterAutomateFunctions.svf2.functionId,
            functionReleaseId: ImporterAutomateFunctions.svf2.functionReleaseId
          }
        ],
        triggerDefinitions: {
          version: 1,
          definitions: [
            {
              // TODO ACC: FILE_UPLOADED
              type: 'VERSION_CREATED',
              modelId: syncItem.modelId
            }
          ]
        }
      },
      userId: creatorUserId,
      skipInputValidation: true
    })

    const newSyncItem: AccSyncItem = {
      ...syncItem,
      id: cryptoRandomString({ length: 10 }),
      automationId: automation.id,
      status: AccSyncItemStatuses.pending,
      authorId: creatorUserId,
      accWebhookId: webhookId ?? undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await deps.upsertAccSyncItem(newSyncItem)

    // TODO ACC: somehow i could not managed to get subsriptions work, doing stupid timeout refetch in FE after create/delete/update
    // Once we have it properly TODO ogu: fix it on FE
    await deps.eventEmit({
      eventName: AccSyncItemEvents.Created,
      payload: {
        syncItem: newSyncItem,
        projectId: newSyncItem.projectId
      }
    })

    // Import new sync item immediately, if possible
    const tokenData = await getToken()
    const manifest = await getManifestByUrn(
      {
        urn: newSyncItem.accFileVersionUrn,
        region: newSyncItem.accRegion
      },
      { token: tokenData.access_token }
    )
    const isReady = isReadyForImport(manifest)

    if (!isReady) return newSyncItem

    return await deps.triggerSyncItemAutomation({ id: newSyncItem.id })
  }

export type GetPaginatedAccSyncItems = (params: {
  projectId: string
  filter?: {
    limit: number | null
    cursor: string | null
  }
}) => Promise<{
  items: AccSyncItem[]
  totalCount: number
  cursor: string | null
}>

export const getPaginatedAccSyncItemsFactory =
  (deps: {
    listAccSyncItems: ListAccSyncItems
    countAccSyncItems: CountAccSyncItems
  }): GetPaginatedAccSyncItems =>
  async ({ projectId, filter = {} }) => {
    const cursor = filter.cursor ? decodeIsoDateCursor(filter.cursor) : null

    const [items, totalCount] = await Promise.all([
      deps.listAccSyncItems({
        projectId,
        filter: {
          updatedBefore: cursor,
          limit: filter?.limit ?? null
        }
      }),
      deps.countAccSyncItems({ projectId })
    ])

    const lastItem = items.at(-1)

    return {
      items,
      totalCount,
      cursor: lastItem ? encodeIsoDateCursor(lastItem.updatedAt) : null
    }
  }

export type UpdateAccSyncItem = <
  Item extends Exact<Partial<AccSyncItem> & Pick<AccSyncItem, 'id'>, Item>
>(params: {
  syncItem: Item
}) => Promise<AccSyncItem>

export const updateAccSyncItemFactory =
  (deps: {
    getAccSyncItemById: GetAccSyncItemById
    upsertAccSyncItem: UpsertAccSyncItem
    eventEmit: EventBusEmit
  }): UpdateAccSyncItem =>
  async ({ syncItem }) => {
    const existingSyncItem = await deps.getAccSyncItemById({
      id: syncItem.id
    })

    if (!existingSyncItem) {
      throw new SyncItemNotFoundError()
    }

    const newSyncItem: AccSyncItem = {
      ...existingSyncItem,
      ...syncItem,
      updatedAt: new Date()
    }

    await deps.upsertAccSyncItem(newSyncItem)

    await deps.eventEmit({
      eventName: AccSyncItemEvents.Updated,
      payload: {
        oldSyncItem: existingSyncItem,
        newSyncItem,
        projectId: newSyncItem.projectId
      }
    })

    return newSyncItem
  }

export type DeleteAccSyncItem = (params: {
  id: string
  projectId: string
}) => Promise<void>

export const deleteAccSyncItemFactory =
  (deps: {
    deleteAccSyncItemById: DeleteAccSyncItemById
    eventEmit: EventBusEmit
  }): DeleteAccSyncItem =>
  async ({ id, projectId }) => {
    const itemCount = await deps.deleteAccSyncItemById({ id })

    if (itemCount === 0) {
      throw new SyncItemNotFoundError()
    }

    await deps.eventEmit({
      eventName: AccSyncItemEvents.Deleted,
      payload: {
        id,
        projectId
      }
    })
  }
