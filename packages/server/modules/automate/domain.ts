import {
  AutomationFunctionRunRecord,
  AutomationRecord,
  AutomationRevisionWithTriggersFunctions,
  AutomationRunWithTriggersFunctionRuns,
  AutomationTokenRecord,
  AutomationTriggerDefinitionRecord,
  AutomationTriggerRecordBase,
  AutomationTriggerType,
  AutomationWithRevision,
  InsertableAutomationRevision,
  InsertableAutomationRun,
  VersionCreationTriggerType
} from '@/modules/automate/helpers/types'
import { BranchRecord, CommitRecord } from '../core/helpers/types'

type ProjectAutomationsArgs = {
  cursor?: string | null
  filter?: string | null
  limit?: number | null
}

export type QueryProjectAutomationsParams = {
  projectId: string
  args: ProjectAutomationsArgs
}

export type GetAutomationRunsForVersionParams = {
  projectId: string
  modelId: string
  versionId: string
}

export interface AutomationRepository {
  findFullAutomationRevisionMetadata: (
    revisionId: string
  ) => Promise<AutomationWithRevision<AutomationRevisionWithTriggersFunctions> | null>
  upsertAutomationRun: (
    automationRun: InsertableAutomationRun
  ) => Promise<[number[], number[]]>
  upsertAutomationFunctionRun: (
    automationFunctionRun: Pick<
      AutomationFunctionRunRecord,
      'id' | 'runId' | 'status' | 'statusMessage' | 'contextView' | 'results'
    >
  ) => Promise<void>
  queryActiveTriggerDefinitions: <
    T extends AutomationTriggerType = AutomationTriggerType
  >(
    params: AutomationTriggerRecordBase<T>
  ) => Promise<AutomationTriggerDefinitionRecord<T>[]>
  insertAutomation: (
    automation: AutomationRecord,
    automationToken: AutomationTokenRecord
  ) => Promise<{ automation: AutomationRecord; token: AutomationTokenRecord }>
  insertAutomationRevision: (
    revision: InsertableAutomationRevision
  ) => Promise<AutomationRevisionWithTriggersFunctions>
  findFunctionRun: (functionRunId: string) => Promise<
    | (AutomationFunctionRunRecord & {
        automationId: string
        automationRevisionId: string
      })
    | null
  >
  countProjectAutomations: (params: QueryProjectAutomationsParams) => Promise<number>
  queryProjectAutomations: (params: QueryProjectAutomationsParams) => {
    items: AutomationRecord[]
    cursor: string | null
  }
  getAutomationRunsForVersion: (
    params: GetAutomationRunsForVersionParams,
    options?: Partial<{ limit: number }>
  ) => Promise<AutomationRunWithTriggersFunctionRuns[]>
  queryAutomationRunFullTriggers: (params: { automationRunId: string }) => Promise<{
    [VersionCreationTriggerType]: {
      triggerType: typeof VersionCreationTriggerType
      triggeringId: string
      model: BranchRecord
      version: CommitRecord
    }[]
  }>
}
