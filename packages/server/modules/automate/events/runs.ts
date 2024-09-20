import {
  AutomationFunctionRunRecord,
  AutomationRunRecord,
  AutomationTriggerType,
  AutomationWithRevision,
  BaseTriggerManifest,
  RunTriggerSource
} from '@/modules/automate/helpers/types'
import { InsertableAutomationRun } from '@/modules/automate/repositories/automations'
import { initializeModuleEventEmitter } from '@/modules/shared/services/moduleEventEmitterSetup'

export enum AutomateRunsEvents {
  Created = 'created',
  StatusUpdated = 'status-updated'
}

export type AutomateEventsPayloads = {
  [AutomateRunsEvents.Created]: {
    automation: AutomationWithRevision
    run: InsertableAutomationRun
    manifests: BaseTriggerManifest[]
    source: RunTriggerSource
    triggerType: AutomationTriggerType
  }
  [AutomateRunsEvents.StatusUpdated]: {
    run: AutomationRunRecord
    functionRun: AutomationFunctionRunRecord
    automationId: string
  }
}

const { emit, listen } = initializeModuleEventEmitter<AutomateEventsPayloads>({
  moduleName: 'automate',
  namespace: 'runs'
})

export const AutomateRunsEmitter = { emit, listen, events: AutomateRunsEvents }

export type AutomateRunsEventsEmitter = (typeof AutomateRunsEmitter)['emit']
export type AutomateRunsEventsListener = (typeof AutomateRunsEmitter)['listen']
