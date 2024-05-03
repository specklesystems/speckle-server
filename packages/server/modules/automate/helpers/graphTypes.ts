import {
  AutomateRevisionFunctionRecord,
  AutomationFunctionRunRecord,
  AutomationRecord,
  AutomationRevisionRecord,
  AutomationRunTriggerRecord,
  AutomationRunWithTriggersFunctionRuns,
  AutomationTriggerDefinitionRecord
} from '@/modules/automate/helpers/types'
import {
  AutomateFunction,
  AutomateFunctionRelease
} from '@/modules/core/graph/generated/graphql'

export type AutomateFunctionGraphQLReturn = Pick<
  AutomateFunction,
  | 'id'
  | 'name'
  | 'repo'
  | 'isFeatured'
  | 'description'
  | 'logo'
  | 'tags'
  | 'supportedSourceApps'
>

export type AutomateFunctionReleaseGraphQLReturn = Pick<
  AutomateFunctionRelease,
  'id' | 'versionTag' | 'createdAt' | 'inputSchema' | 'commitId' | 'functionId'
>

export type AutomationGraphQLReturn = AutomationRecord

export type AutomationRevisionGraphQLReturn = AutomationRevisionRecord

export type ProjectAutomationMutationsGraphQLReturn = { projectId: string }

export type AutomationRevisionTriggerDefinitionGraphQLReturn =
  AutomationTriggerDefinitionRecord
export type AutomationRunTriggerGraphQLReturn = AutomationRunTriggerRecord

export type AutomationRevisionFunctionGraphQLReturn = AutomateRevisionFunctionRecord

export type AutomateRunGraphQLReturn = AutomationRunWithTriggersFunctionRuns

export type AutomateFunctionRunGraphQLReturn = AutomationFunctionRunRecord
