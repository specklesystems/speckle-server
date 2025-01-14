import { AutomationRecord } from '@/modules/automate/helpers/types'
import { StoredInsertableAutomationRevision } from '@/modules/automate/repositories/automations'

export const automationEventsNamespace = 'automations' as const

export const AutomationEvents = {
  Created: `${automationEventsNamespace}.created`,
  Updated: `${automationEventsNamespace}.updated`,
  CreatedRevision: `${automationEventsNamespace}.created-revision`
} as const

export type AutomationEventsPayloads = {
  [AutomationEvents.Created]: { automation: AutomationRecord }
  [AutomationEvents.Updated]: { automation: AutomationRecord }
  [AutomationEvents.CreatedRevision]: {
    automation: AutomationRecord
    revision: StoredInsertableAutomationRevision
  }
}
