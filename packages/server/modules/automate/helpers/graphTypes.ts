import {
  AutomateRevisionFunctionRecord,
  AutomationFunctionRunRecord,
  AutomationRecord,
  AutomationRevisionRecord,
  AutomationRunStatus,
  AutomationRunTriggerRecord,
  AutomationRunWithTriggersFunctionRuns,
  AutomationTriggerDefinitionRecord
} from '@/modules/automate/helpers/types'
import {
  AutomateFunction,
  AutomateFunctionRelease,
  TriggeredAutomationsStatus
} from '@/modules/core/graph/generated/graphql'
import { Nullable } from '@speckle/shared'
import { Merge } from 'type-fest'

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

export type AutomationRevisionFunctionGraphQLReturn = Merge<
  AutomateRevisionFunctionRecord,
  {
    functionInputs: Nullable<Record<string, unknown>>
    release: AutomateFunctionReleaseGraphQLReturn
  }
>

export type AutomateRunGraphQLReturn = AutomationRunWithTriggersFunctionRuns

export type AutomateFunctionRunGraphQLReturn = AutomationFunctionRunRecord

export type TriggeredAutomationsStatusGraphQLReturn = Merge<
  TriggeredAutomationsStatus,
  { status: AutomationRunStatus; automationRuns: AutomateRunGraphQLReturn[] }
>
