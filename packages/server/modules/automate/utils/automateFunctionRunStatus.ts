import {
  AutomationRunStatus,
  AutomationRunStatuses
} from '@/modules/automate/helpers/types'
import { FunctionRunReportStatusesError } from '@/modules/automate/errors/runs'
import { AutomateRunStatus } from '@/modules/core/graph/generated/graphql'

const AutomationRunStatusOrder: Array<AutomationRunStatus | AutomationRunStatus[]> = [
  AutomationRunStatuses.pending,
  AutomationRunStatuses.running,
  [
    AutomationRunStatuses.exception,
    AutomationRunStatuses.failed,
    AutomationRunStatuses.succeeded
  ]
]

/**
 * Given a previous and new status, verify that the new status is a valid move.
 * @remarks This is to protect against race conditions that may report "backwards" motion
 * in function statuses. (i.e. `FAILED` => `RUNNING`)
 */
export const validateStatusChange = (
  previousStatus: AutomationRunStatus,
  newStatus: AutomationRunStatus
): void => {
  if (previousStatus === newStatus) return

  const previousStatusIndex = AutomationRunStatusOrder.findIndex((s) =>
    Array.isArray(s) ? s.includes(previousStatus) : s === previousStatus
  )
  const newStatusIndex = AutomationRunStatusOrder.findIndex((s) =>
    Array.isArray(s) ? s.includes(newStatus) : s === newStatus
  )

  if (newStatusIndex <= previousStatusIndex) {
    throw new FunctionRunReportStatusesError(
      `Invalid status change. Attempting to move from '${previousStatus}' to '${newStatus}'.`
    )
  }
}

export const mapGqlStatusToDbStatus = (status: AutomateRunStatus) => {
  switch (status) {
    case AutomateRunStatus.Pending:
      return AutomationRunStatuses.pending
    case AutomateRunStatus.Initializing:
      return AutomationRunStatuses.initializing
    case AutomateRunStatus.Running:
      return AutomationRunStatuses.running
    case AutomateRunStatus.Succeeded:
      return AutomationRunStatuses.succeeded
    case AutomateRunStatus.Failed:
      return AutomationRunStatuses.failed
    case AutomateRunStatus.Exception:
      return AutomationRunStatuses.exception
    case AutomateRunStatus.Timeout:
      return AutomationRunStatuses.timeout
    case AutomateRunStatus.Canceled:
      return AutomationRunStatuses.canceled
  }
}

export const mapDbStatusToGqlStatus = (status: AutomationRunStatus) => {
  switch (status) {
    case AutomationRunStatuses.pending:
      return AutomateRunStatus.Pending
    case AutomationRunStatuses.initializing:
      return AutomateRunStatus.Initializing
    case AutomationRunStatuses.running:
      return AutomateRunStatus.Running
    case AutomationRunStatuses.succeeded:
      return AutomateRunStatus.Succeeded
    case AutomationRunStatuses.failed:
      return AutomateRunStatus.Failed
    case AutomationRunStatuses.exception:
      return AutomateRunStatus.Exception
    case AutomationRunStatuses.timeout:
      return AutomateRunStatus.Timeout
    case AutomationRunStatuses.canceled:
      return AutomateRunStatus.Canceled
  }
}
