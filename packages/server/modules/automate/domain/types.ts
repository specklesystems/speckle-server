import {
  AutomationFunctionRunRecord,
  AutomationRunTriggerRecord,
  AutomationTriggerType
} from '@/modules/automate/helpers/types'
import { BranchRecord, CommitRecord } from '@/modules/core/helpers/types'

export type InsertableAutomationFunctionRun = Pick<
  AutomationFunctionRunRecord,
  'id' | 'runId' | 'status' | 'statusMessage' | 'contextView' | 'results'
>

export type AutomationRunFullTrigger<
  T extends AutomationTriggerType = AutomationTriggerType
> = AutomationRunTriggerRecord<T> & {
  versions: CommitRecord[]
  models: BranchRecord[]
}
