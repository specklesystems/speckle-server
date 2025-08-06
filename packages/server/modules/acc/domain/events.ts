import type { AccSyncItem } from '@/modules/acc/domain/types'

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
  }
  [AccSyncItemEvents.Deleted]: {
    id: string
    projectId: string
    userId?: string
  }
}
