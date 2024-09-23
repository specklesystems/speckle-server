import {
  GetFunctionRun,
  UpdateAutomationRun,
  UpsertAutomationFunctionRun
} from '@/modules/automate/domain/operations'
import {
  FunctionRunReportStatusError,
  FunctionRunNotFoundError
} from '@/modules/automate/errors/runs'
import {
  AutomateRunsEmitter,
  AutomateRunsEventsEmitter
} from '@/modules/automate/events/runs'
import {
  AutomationFunctionRunRecord,
  AutomationRunStatus,
  AutomationRunStatuses
} from '@/modules/automate/helpers/types'
import { Automate } from '@speckle/shared'

const AutomationRunStatusOrder: { [key in AutomationRunStatus]: number } = {
  [AutomationRunStatuses.pending]: 0,
  [AutomationRunStatuses.initializing]: 1,
  [AutomationRunStatuses.running]: 2,
  [AutomationRunStatuses.succeeded]: 3,
  [AutomationRunStatuses.failed]: 3,
  [AutomationRunStatuses.exception]: 5,
  [AutomationRunStatuses.timeout]: 5,
  [AutomationRunStatuses.canceled]: 4
}

/**
 * Given a previous and new status, verify that the new status is a valid move.
 * @remarks This is to protect against race conditions that may report "backwards" motion
 * in function statuses. (i.e. `FAILED` => `RUNNING`)
 */
export const validateStatusChange = (
  previousStatus: AutomationRunStatus,
  newStatus: AutomationRunStatus
): void => {
  const previousStatusRank = AutomationRunStatusOrder[previousStatus]
  const newStatusRank = AutomationRunStatusOrder[newStatus]

  if (newStatusRank <= previousStatusRank) {
    throw new FunctionRunReportStatusError(
      `Invalid status change. Attempting to move from '${previousStatus}' to '${newStatus}'.`
    )
  }
}

export const validateContextView = (contextView: string) => {
  if (!contextView.length) {
    throw new FunctionRunReportStatusError('Context view must be a valid relative URL')
  }

  if (!contextView.startsWith('/')) {
    throw new FunctionRunReportStatusError(
      'Context view must start with a forward slash'
    )
  }

  // Try parsing URL
  try {
    new URL(contextView, 'https://unimportant.com')
  } catch (e) {
    throw new FunctionRunReportStatusError('Invalid relative URL')
  }
}

export const resolveStatusFromFunctionRunStatuses = (
  functionRunStatuses: AutomationRunStatus[]
) => {
  const anyPending =
    functionRunStatuses.includes(AutomationRunStatuses.pending) ||
    functionRunStatuses.includes(AutomationRunStatuses.initializing)
  if (anyPending) return AutomationRunStatuses.pending

  const anyRunning = functionRunStatuses.includes(AutomationRunStatuses.running)
  if (anyRunning) return AutomationRunStatuses.running

  const anyFailure = functionRunStatuses.includes(AutomationRunStatuses.failed)
  if (anyFailure) return AutomationRunStatuses.failed

  const anyError = functionRunStatuses.includes(AutomationRunStatuses.exception)
  if (anyError) return AutomationRunStatuses.exception

  return AutomationRunStatuses.succeeded
}

export type ReportFunctionRunStatusDeps = {
  getAutomationFunctionRunRecord: GetFunctionRun
  upsertAutomationFunctionRunRecord: UpsertAutomationFunctionRun
  automationRunUpdater: UpdateAutomationRun
  runEventEmit: AutomateRunsEventsEmitter
}

export const reportFunctionRunStatusFactory =
  (deps: ReportFunctionRunStatusDeps) =>
  async (
    params: Pick<
      AutomationFunctionRunRecord,
      'runId' | 'status' | 'statusMessage' | 'contextView' | 'results'
    >
  ): Promise<boolean> => {
    const {
      getAutomationFunctionRunRecord,
      upsertAutomationFunctionRunRecord,
      automationRunUpdater,
      runEventEmit
    } = deps
    const { runId, ...statusReportData } = params

    const currentFunctionRunRecordResult = await getAutomationFunctionRunRecord(runId)

    if (!currentFunctionRunRecordResult) {
      throw new FunctionRunNotFoundError()
    }

    const { automationId, ...currentFunctionRunRecord } = currentFunctionRunRecordResult

    if (statusReportData.results) {
      statusReportData.results = Automate.AutomateTypes.formatResultsSchema(
        statusReportData.results
      )
    }

    if (statusReportData.contextView) validateContextView(statusReportData.contextView)

    const currentStatus = currentFunctionRunRecord.status
    const nextStatus = statusReportData.status

    validateStatusChange(currentStatus, nextStatus)

    const elapsed = new Date().getTime() - currentFunctionRunRecord.createdAt.getTime()

    const nextFunctionRunRecord = {
      ...currentFunctionRunRecord,
      ...statusReportData,
      elapsed
    }

    await upsertAutomationFunctionRunRecord(nextFunctionRunRecord)

    const updatedRun = await automationRunUpdater({
      id: currentFunctionRunRecord.runId,
      status: resolveStatusFromFunctionRunStatuses([nextStatus]),
      updatedAt: new Date()
    })

    await runEventEmit(AutomateRunsEmitter.events.StatusUpdated, {
      run: updatedRun,
      functionRun: nextFunctionRunRecord,
      automationId
    })

    return true
  }
