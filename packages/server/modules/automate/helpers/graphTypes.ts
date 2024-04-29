import {
  AutomateFunctionRecord,
  AutomationRecord
} from '@/modules/automate/helpers/types'

export type AutomateFunctionGraphQLReturn = AutomateFunctionRecord

export type AutomationGraphQLReturn = AutomationRecord

export type ProjectAutomationMutationsGraphQLReturn = { projectId: string }
