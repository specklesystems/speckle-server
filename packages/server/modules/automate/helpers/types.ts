import { Automate, Nullable } from '@speckle/shared'

export type AutomationRecord = {
  id: string
  name: string
  projectId: string
  userId: string | null
  enabled: boolean
  createdAt: Date
  updatedAt: Date
  executionEngineAutomationId: string
}

export type AutomationRevisionRecord = {
  id: string
  automationId: string
  active: boolean
  createdAt: Date
  userId: string | null
}

export type AutomationRunStatus =
  | 'pending'
  | 'running'
  | 'success'
  | 'failure'
  | 'error'

export const AutomationRunStatuses: Record<AutomationRunStatus, AutomationRunStatus> = {
  pending: 'pending',
  running: 'running',
  success: 'success',
  failure: 'failure',
  error: 'error'
}

export type AutomationRunRecord = {
  id: string
  automationRevisionId: string
  createdAt: Date
  updatedAt: Date
  status: AutomationRunStatus
  executionEngineRunId: string | null
}

export type AutomateRevisionFunctionRecord = {
  functionReleaseId: string
  functionId: string
  functionInputs: Record<string, unknown> | null
  automationRevisionId: string
}

export const VersionCreationTriggerType = <const>'versionCreation'
export type AutomationTriggerType = typeof VersionCreationTriggerType

export type AutomationTriggerRecordBase<
  T extends AutomationTriggerType = AutomationTriggerType
> = {
  triggeringId: string
  triggerType: T
}

/**
 * If type === 'versionCreation', triggeringId refers to model id
 */
export type AutomationTriggerDefinitionRecord<
  T extends AutomationTriggerType = AutomationTriggerType
> = {
  automationRevisionId: string
} & AutomationTriggerRecordBase<T>

/**
 * If type === 'versionCreation', triggeringId refers to version id
 */
export type AutomationRunTriggerRecord = {
  automationRunId: string
} & AutomationTriggerRecordBase

export type AutomationTokenRecord = {
  automationId: string
  automateToken: string
}

export type AutomationRevisionWithTriggersFunctions = AutomationRevisionRecord & {
  functions: AutomateRevisionFunctionRecord[]
  triggers: AutomationTriggerDefinitionRecord[]
}

export type AutomationWithRevision<
  R extends AutomationRevisionRecord = AutomationRevisionRecord
> = AutomationRecord & {
  revision: R
}

export type AutomationRunWithTriggersFunctionRuns = AutomationRunRecord & {
  triggers: AutomationRunTriggerRecord[]
  functionRuns: AutomationFunctionRunRecord[]
}

export type ObjectResultLevel = 'info' | 'warning' | 'error'

export type AutomationFunctionRunRecord = {
  id: string
  runId: string
  functionReleaseId: string
  functionId: string
  elapsed: number
  status: AutomationRunStatus
  contextView: string | null
  statusMessage: string | null
  results: Nullable<Automate.AutomateTypes.ResultsSchema>
}

export type BaseTriggerManifest<
  T extends AutomationTriggerType = AutomationTriggerType
> = {
  triggerType: T
}

export type VersionCreatedTriggerManifest = BaseTriggerManifest<
  typeof VersionCreationTriggerType
> & {
  modelId: string
  versionId: string
}

export const isVersionCreatedTriggerManifest = (
  t: BaseTriggerManifest
): t is VersionCreatedTriggerManifest => t.triggerType === VersionCreationTriggerType
