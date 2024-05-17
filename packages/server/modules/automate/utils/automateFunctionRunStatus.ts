import {
  AutomationRunStatus,
  AutomationRunStatuses
} from '@/modules/automate/helpers/types'
import { AutomateRunStatus } from '@/modules/core/graph/generated/graphql'

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
