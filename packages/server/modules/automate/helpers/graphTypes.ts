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
  ProjectAutomationsUpdatedMessage,
  ProjectTriggeredAutomationsStatusUpdatedMessageType,
  TriggeredAutomationsStatus
} from '@/modules/core/graph/generated/graphql'
import { Nullable } from '@speckle/shared'
import { Merge, SetOptional } from 'type-fest'

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
> & {
  functionCreator: Nullable<{
    speckleUserId: string
    speckleServerOrigin: string
  }>
}

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

export type AutomateRunGraphQLReturn = SetOptional<
  AutomationRunWithTriggersFunctionRuns,
  'triggers'
>

export type AutomateFunctionRunGraphQLReturn = AutomationFunctionRunRecord

export type TriggeredAutomationsStatusGraphQLReturn = Merge<
  TriggeredAutomationsStatus,
  { status: AutomationRunStatus; automationRuns: AutomateRunGraphQLReturn[] }
>

export type ProjectTriggeredAutomationsStatusUpdatedMessageGraphQLReturn = {
  projectId: string
  modelId: string
  versionId: string
  run: AutomateRunGraphQLReturn
  type: ProjectTriggeredAutomationsStatusUpdatedMessageType
}

export type ProjectAutomationsUpdatedMessageGraphQLReturn = Merge<
  ProjectAutomationsUpdatedMessage,
  {
    automation: AutomationGraphQLReturn | null
    revision: AutomationRevisionGraphQLReturn | null
  }
>

export type UserAutomateInfoGraphQLReturn = { userId: string }
