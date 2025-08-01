import type { AccSyncItem } from '@/modules/acc/domain/types'
import type {
  DeleteAccSyncItemInput,
  UpdateAccSyncItemInput
} from '@/modules/core/graph/generated/graphql'

export const accSyncItemEventsNamespace = 'accSyncItems' as const

export const AccSyncItemEvents = {
  Created: `${accSyncItemEventsNamespace}:created`,
  Updated: `${accSyncItemEventsNamespace}:updated`,
  Deleted: `${accSyncItemEventsNamespace}:deleted`
} as const

export type AccSyncItemEventsPayloads = {
  [AccSyncItemEvents.Created]: {
    syncItem: AccSyncItem
    projectId: string
  }
  [AccSyncItemEvents.Updated]: {
    oldSyncItem: AccSyncItem
    newSyncItem: AccSyncItem
    projectId: string
    userId?: string
    input: UpdateAccSyncItemInput
  }
  [AccSyncItemEvents.Deleted]: {
    syncItem: AccSyncItem
    projectId: string
    userId?: string
    input: DeleteAccSyncItemInput
  }
}
