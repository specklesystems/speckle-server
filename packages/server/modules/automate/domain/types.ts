import { AutomationFunctionRunRecord } from '@/modules/automate/helpers/types'

export type InsertableAutomationFunctionRun = Pick<
  AutomationFunctionRunRecord,
  'id' | 'runId' | 'status' | 'statusMessage' | 'contextView' | 'results'
>
