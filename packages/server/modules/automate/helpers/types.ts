import { Automate, Nullable } from '@speckle/shared'

export type AutomationRecord = {
  id: string
  name: string
  projectId: string
  userId: string | null
  enabled: boolean
  createdAt: Date
  updatedAt: Date
} & (
  | {
      executionEngineAutomationId: string
      isTestAutomation: false
    }
  | {
      executionEngineAutomationId: null
      isTestAutomation: true
    }
)

export type TestAutomation<R extends AutomationRecord> = R & {
  isTestAutomation: true
}

export type LiveAutomation<R extends AutomationRecord> = R & {
  isTestAutomation: false
}

export type AutomationRevisionRecord = {
  id: string
  automationId: string
  active: boolean
  createdAt: Date
  userId: string | null
  publicKey: string
}

export type AutomationRunStatus =
  | 'pending'
  | 'initializing'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'exception'
  | 'timeout'
  | 'canceled'

export const AutomationRunStatuses: { [key in AutomationRunStatus]: key } = {
  pending: 'pending',
  initializing: 'initializing',
  running: 'running',
  succeeded: 'succeeded',
  failed: 'failed',
  exception: 'exception',
  timeout: 'timeout',
  canceled: 'canceled'
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
  functionInputs: string | null
  automationRevisionId: string
}

export enum RunTriggerSource {
  Automatic = 'automatic',
  Manual = 'manual'
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

export const isVersionCreatedTrigger = (
  val: AutomationTriggerRecordBase
): val is AutomationTriggerRecordBase<typeof VersionCreationTriggerType> => {
  return val.triggerType === VersionCreationTriggerType
}

/**
 * If type === 'versionCreation', triggeringId refers to version id
 */
export type AutomationRunTriggerRecord<
  T extends AutomationTriggerType = AutomationTriggerType
> = {
  automationRunId: string
} & AutomationTriggerRecordBase<T>

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

export type AutomationRunWithFunctionRuns = AutomationRunRecord & {
  automationId: string
  functionRuns: AutomationFunctionRunRecord[]
}

export type AutomationRunWithTriggersFunctionRuns = AutomationRunWithFunctionRuns & {
  triggers: AutomationRunTriggerRecord[]
}

export type ObjectResultLevel = 'info' | 'warning' | 'error'

export type AutomationFunctionRunRecord = {
  id: string
  runId: string
  functionReleaseId: string
  functionId: string
  elapsed: number
  status: AutomationRunStatus
  createdAt: Date
  updatedAt: Date
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
  projectId: string
}

export const isVersionCreatedTriggerManifest = (
  t: BaseTriggerManifest
): t is VersionCreatedTriggerManifest => t.triggerType === VersionCreationTriggerType
