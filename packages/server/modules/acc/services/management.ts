import { tryRegisterAccWebhook } from '@/modules/acc/clients/autodesk'
import { ImporterAutomateFunctions } from '@/modules/acc/domain/constants'
import { AccSyncItemEvents } from '@/modules/acc/domain/events'
import type {
  GetAccSyncItemByUrn,
  UpsertAccSyncItem
} from '@/modules/acc/domain/operations'
import type { AccRegion, AccSyncItem } from '@/modules/acc/domain/types'
import { DuplicateSyncItemError, SyncItemNotFoundError } from '@/modules/acc/errors/acc'
import type {
  CreateAutomation,
  CreateAutomationRevision
} from '@/modules/automate/domain/operations'
import { getServerOrigin } from '@/modules/shared/helpers/envHelper'
import type { EventBusEmit } from '@/modules/shared/services/eventBus'
import cryptoRandomString from 'crypto-random-string'

export type CreateAccSyncItem = (params: {
  syncItem: Pick<
    AccSyncItem,
    | 'projectId'
    | 'modelId'
    | 'accRegion'
    | 'accHubId'
    | 'accProjectId'
    | 'accRootProjectFolderId'
    | 'accFileLineageId'
    | 'accFileName'
    | 'accFileExtension'
    | 'accFileVersionIndex'
    | 'accFileVersionUrn'
  >
  creatorUserId: string
}) => Promise<AccSyncItem>

export const createAccSyncItemFactory =
  (deps: {
    getAccSyncItemByUrn: GetAccSyncItemByUrn
    upsertAccSyncItem: UpsertAccSyncItem
    createAutomation: CreateAutomation
    createAutomationRevision: CreateAutomationRevision
    eventEmit: EventBusEmit
  }): CreateAccSyncItem =>
  async ({ syncItem, creatorUserId }) => {
    const existingSyncItem = await deps.getAccSyncItemByUrn({
      urn: syncItem.accFileLineageId
    })

    if (!!existingSyncItem) {
      throw new DuplicateSyncItemError(syncItem.accFileLineageId)
    }

    const webhookId = await tryRegisterAccWebhook({
      // For local development, you may set your public tailscale url as your local server's canonical origin
      callbackUrl: `${getServerOrigin()}/api/v1/acc/webhook/callback`,
      event: 'dm.version.added',
      rootProjectFolderUrn: syncItem.accRootProjectFolderId,
      region: syncItem.accRegion as AccRegion
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
      status: 'PENDING',
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

    return newSyncItem
  }

export type UpdateAccSyncItem = (params: {
  syncItem: Pick<AccSyncItem, 'accFileLineageId' | 'status'>
}) => Promise<AccSyncItem>

export const updateAccSyncItemFactory =
  (deps: {
    getAccSyncItemByUrn: GetAccSyncItemByUrn
    upsertAccSyncItem: UpsertAccSyncItem
  }): UpdateAccSyncItem =>
  async ({ syncItem }) => {
    const existingSyncItem = await deps.getAccSyncItemByUrn({
      urn: syncItem.accFileLineageId
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

    return newSyncItem
  }
