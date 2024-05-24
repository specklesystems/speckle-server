import {
  AutomationRecord,
  AutomationRevisionWithTriggersFunctions
} from '@/modules/automate/helpers/types'
import { initializeModuleEventEmitter } from '@/modules/shared/services/moduleEventEmitterSetup'

export enum AutomationsEvents {
  Created = 'created',
  Updated = 'updated',
  CreatedRevision = 'created-revision'
}

export type AutomationsEventsPayloads = {
  [AutomationsEvents.Created]: {
    automation: AutomationRecord
  }
  [AutomationsEvents.Updated]: {
    automation: AutomationRecord
  }
  [AutomationsEvents.CreatedRevision]: {
    automation: AutomationRecord
    revision: AutomationRevisionWithTriggersFunctions
  }
}

const { emit, listen } = initializeModuleEventEmitter<AutomationsEventsPayloads>({
  moduleName: 'automate',
  namespace: 'runs'
})

export const AutomationsEmitter = { emit, listen, events: AutomationsEvents }
