import {
  AutomationRunStatus,
  AutomationRunStatuses
} from '@/modules/automate/helpers/types'

export const isFinished = (runStatus: AutomationRunStatus) => {
  const finishedStatuses: AutomationRunStatus[] = [
    AutomationRunStatuses.succeeded,
    AutomationRunStatuses.failed,
    AutomationRunStatuses.exception,
    AutomationRunStatuses.timeout,
    AutomationRunStatuses.canceled
  ]

  return finishedStatuses.includes(runStatus)
}
