import {
  AutomationFunctionRunRecord,
  AutomationRunRecord,
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
    run: InsertableAutomationRun
    manifests: BaseTriggerManifest[]
  }
  [AutomateRunsEvents.StatusUpdated]: {
    run: AutomationRunRecord
    functionRuns: AutomationFunctionRunRecord[]
  }
}

const { emit, listen } = initializeModuleEventEmitter<AutomateEventsPayloads>({
  moduleName: 'automate',
  namespace: 'runs'
})

export const AutomateRunsEmitter = { emit, listen, events: AutomateRunsEvents }
