import { ServerAccessRequestRecord } from '@/modules/accessrequests/repositories'
import { StreamRoles } from '@speckle/shared'

export const accessRequestEventsNamespace = 'accessrequests' as const

export const AccessRequestEvents = {
  Created: `${accessRequestEventsNamespace}.created`,
  Finalized: `${accessRequestEventsNamespace}.finalized`
} as const

export type AccessRequestEventsPayloads = {
  [AccessRequestEvents.Created]: { request: ServerAccessRequestRecord }
  [AccessRequestEvents.Finalized]: {
    request: ServerAccessRequestRecord
    /**
     * ID of the user that finalized this request
     */
    finalizedBy: string
    /**
     * If this object is set, request was approved
     */
    approved?: {
      role: StreamRoles
    }
  }
}
