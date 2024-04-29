import {
  AutomateFunctionRecord,
  AutomationRecord,
  AutomationRevisionRecord
} from '@/modules/automate/helpers/types'

export type AutomateFunctionGraphQLReturn = AutomateFunctionRecord

export type AutomationGraphQLReturn = AutomationRecord

export type AutomationRevisionGraphQLReturn = AutomationRevisionRecord

export type ProjectAutomationMutationsGraphQLReturn = { projectId: string }
