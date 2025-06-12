import {
  AutomationFunctionRunRecord,
  AutomationRecord,
  AutomationRunRecord,
  AutomationTriggerType,
  AutomationWithRevision,
  BaseTriggerManifest,
  RunTriggerSource
} from '@/modules/automate/helpers/types'
import {
  InsertableAutomationRun,
  StoredInsertableAutomationRevision
} from '@/modules/automate/repositories/automations'

export const automationEventsNamespace = 'automations' as const
export const automationRunEventsNamespace = 'automationRuns' as const

export const AutomationEvents = {
  Created: `${automationEventsNamespace}.created`,
  Updated: `${automationEventsNamespace}.updated`,
  CreatedRevision: `${automationEventsNamespace}.created-revision`
} as const

export const AutomationRunEvents = {
  Created: `${automationRunEventsNamespace}.created`,
  StatusUpdated: `${automationRunEventsNamespace}.status-updated`
} as const

export type AutomationEventsPayloads = {
  [AutomationEvents.Created]: { automation: AutomationRecord }
  [AutomationEvents.Updated]: { automation: AutomationRecord }
  [AutomationEvents.CreatedRevision]: {
    automation: AutomationRecord
    revision: StoredInsertableAutomationRevision
  }
}

export type AutomationRunEventsPayloads = {
  [AutomationRunEvents.Created]: {
    automation: AutomationWithRevision
    run: InsertableAutomationRun
    manifests: BaseTriggerManifest[]
    source: RunTriggerSource
    triggerType: AutomationTriggerType
  }
  [AutomationRunEvents.StatusUpdated]: {
    run: AutomationRunRecord
    functionRun: AutomationFunctionRunRecord
    automationId: string
    projectId: string
  }
}
