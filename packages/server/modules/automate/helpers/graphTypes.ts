import {
  AutomationRevisionFunctionRecord,
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
  | 'workspaceIds'
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

export type AutomationRevisionGraphQLReturn = AutomationRevisionRecord & {
  projectId: string
}

export type ProjectAutomationMutationsGraphQLReturn = { projectId: string }

export type AutomationRevisionTriggerDefinitionGraphQLReturn =
  AutomationTriggerDefinitionRecord & { projectId: string }
export type AutomationRunTriggerGraphQLReturn = AutomationRunTriggerRecord & {
  projectId: string
}

export type AutomationRevisionFunctionGraphQLReturn = Merge<
  AutomationRevisionFunctionRecord,
  {
    functionInputs: Nullable<Record<string, unknown>>
    release: AutomateFunctionReleaseGraphQLReturn
  }
>

export type AutomateRunGraphQLReturn = SetOptional<
  AutomationRunWithTriggersFunctionRuns,
  'triggers'
> & { projectId: string }

export type AutomateFunctionRunGraphQLReturn = AutomationFunctionRunRecord & {
  automationId: string
  projectId: string
}

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
