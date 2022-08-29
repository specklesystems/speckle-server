import { ServerAccessRequestRecord } from '@/modules/accessrequests/repositories'
import { StreamRoles } from '@/modules/core/helpers/mainConstants'
import { initializeModuleEventEmitter } from '@/modules/shared/services/moduleEventEmitterSetup'

export enum AccessRequestsEvents {
  Created = 'created',
  Finalized = 'finalized'
}

export type AccessRequestsEventsPayloads = {
  [AccessRequestsEvents.Created]: { request: ServerAccessRequestRecord }
  [AccessRequestsEvents.Finalized]: {
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

const { emit, listen } = initializeModuleEventEmitter<AccessRequestsEventsPayloads>({
  moduleName: 'accessrequests'
})

export const AccessRequestsEmitter = { emit, listen, events: AccessRequestsEvents }
