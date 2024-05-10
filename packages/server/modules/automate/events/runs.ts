import {
  AutomationFunctionRunRecord,
  AutomationRunRecord,
  AutomationWithRevision,
  BaseTriggerManifest
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
  }
  [AutomateRunsEvents.StatusUpdated]: {
    run: AutomationRunRecord
    functionRuns: AutomationFunctionRunRecord[]
    automationId: string
  }
}

const { emit, listen } = initializeModuleEventEmitter<AutomateEventsPayloads>({
  moduleName: 'automate',
  namespace: 'runs'
})

export const AutomateRunsEmitter = { emit, listen, events: AutomateRunsEvents }
