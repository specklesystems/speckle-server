import {
  AutomationRevisionWithTriggersFunctions,
  AutomationWithRevision
} from './helpers/types'

export interface AutomationRepository {
  findFullAutomationRevisionMetadata: (
    revisionId: string
  ) => Promise<AutomationWithRevision<AutomationRevisionWithTriggersFunctions> | null>
}
