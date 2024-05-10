import { automateLogger } from '@/logging/logging'
import { FunctionRunReportStatusesError } from '@/modules/automate/errors/runs'
import { AutomateRunsEmitter } from '@/modules/automate/events/runs'
import {
  AutomationRunStatus,
  AutomationRunStatuses
} from '@/modules/automate/helpers/types'
import {
  GetFunctionRunsForAutomationRunIdsItem,
  getFunctionRuns,
  getFunctionRunsForAutomationRunIds,
  updateAutomationRun,
  updateFunctionRun
} from '@/modules/automate/repositories/automations'
import {
  AutomateFunctionRunStatusReportInput,
  AutomateRunStatus
} from '@/modules/core/graph/generated/graphql'
import { Automate } from '@speckle/shared'
import { difference, groupBy, keyBy, mapValues, reduce, uniqBy } from 'lodash'

const AutomationRunStatusOrder: Array<AutomationRunStatus | AutomationRunStatus[]> = [
  AutomationRunStatuses.pending,
  AutomationRunStatuses.running,
  [
    AutomationRunStatuses.error,
    AutomationRunStatuses.failure,
    AutomationRunStatuses.success
  ]
]

export const mapGqlStatusToDbStatus = (status: AutomateRunStatus) => {
  switch (status) {
    case AutomateRunStatus.Initializing:
      return AutomationRunStatuses.pending
    case AutomateRunStatus.Running:
      return AutomationRunStatuses.running
    case AutomateRunStatus.Succeeded:
      return AutomationRunStatuses.success
    case AutomateRunStatus.Failed:
      return AutomationRunStatuses.failure
  }
}

export const mapDbStatusToGqlStatus = (status: AutomationRunStatus) => {
  switch (status) {
    case AutomationRunStatuses.pending:
      return AutomateRunStatus.Initializing
    case AutomationRunStatuses.running:
      return AutomateRunStatus.Running
    case AutomationRunStatuses.success:
      return AutomateRunStatus.Succeeded
    case AutomationRunStatuses.failure:
    case AutomationRunStatuses.error:
      return AutomateRunStatus.Failed
  }
}

const validateStatusChange = (
  previousStatus: AutomationRunStatus,
  newStatus: AutomationRunStatus
) => {
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

const validateContextView = (contextView: string) => {
  if (!contextView.length) {
    throw new FunctionRunReportStatusesError(
      'Context view must be a valid relative URL'
    )
  }

  if (!contextView.startsWith('/')) {
    throw new FunctionRunReportStatusesError(
      'Context view must start with a forward slash'
    )
  }

  // Try parsing URL
  try {
    new URL(contextView, 'https://unimportant.com')
  } catch (e) {
    throw new FunctionRunReportStatusesError('Invalid relative URL')
  }
}

type ValidatedRunStatusUpdateItem = {
  update: AutomateFunctionRunStatusReportInput
  run: Awaited<ReturnType<typeof getFunctionRuns>>[0]
  newStatus: AutomationRunStatus
}

export const resolveStatusFromFunctionRunStatuses = (
  functionRunStatuses: AutomationRunStatus[]
) => {
  const anyPending = functionRunStatuses.includes(AutomationRunStatuses.pending)
  if (anyPending) return AutomationRunStatuses.pending

  const anyRunning = functionRunStatuses.includes(AutomationRunStatuses.running)
  if (anyRunning) return AutomationRunStatuses.running

  const anyError = functionRunStatuses.includes(AutomationRunStatuses.error)
  if (anyError) return AutomationRunStatuses.error

  const anyFailure = functionRunStatuses.includes(AutomationRunStatuses.failure)
  if (anyFailure) return AutomationRunStatuses.failure

  return AutomationRunStatuses.success
}

export type ReportFunctionRunStatusesDeps = {
  getFunctionRuns: typeof getFunctionRuns
  updateFunctionRun: typeof updateFunctionRun
  updateAutomationRun: typeof updateAutomationRun
  getFunctionRunsForAutomationRunIds: typeof getFunctionRunsForAutomationRunIds
}

export const reportFunctionRunStatuses =
  (deps: ReportFunctionRunStatusesDeps) =>
  async (params: { inputs: AutomateFunctionRunStatusReportInput[] }) => {
    const { inputs } = params
    const { getFunctionRuns, updateFunctionRun, updateAutomationRun } = deps

    const uniqueInputs = uniqBy(inputs, (i) => i.functionRunId)
    const updatableFunctionRunIds = uniqueInputs.map((i) => i.functionRunId)
    const existingRuns = keyBy(
      await getFunctionRuns({
        functionRunIds: updatableFunctionRunIds
      }),
      (r) => r.id
    )
    const allAutomationRunFunctionRuns = reduce(
      await getFunctionRunsForAutomationRunIds({
        functionRunIds: updatableFunctionRunIds
      }),
      (acc, r) => {
        acc[r.runId] = acc[r.runId] || {}
        acc[r.runId][r.id] = r
        return acc
      },
      {} as Record<string, Record<string, GetFunctionRunsForAutomationRunIdsItem>>
    )

    const errorsByRunId: Record<string, string> = {}
    const validatedUpdates: Array<ValidatedRunStatusUpdateItem> = []
    for (const input of uniqueInputs) {
      const run = existingRuns[input.functionRunId]
      if (!run) {
        errorsByRunId[input.functionRunId] = `Function run not found`
        continue
      }

      const newStatus = mapGqlStatusToDbStatus(input.status)

      try {
        validateStatusChange(run.status, newStatus)
      } catch (e) {
        if (e instanceof FunctionRunReportStatusesError) {
          errorsByRunId[
            input.functionRunId
          ] = `Invalid status change for function run: ${e.message}`
          continue
        } else {
          throw e
        }
      }

      if (input.results) {
        try {
          Automate.AutomateTypes.formatResultsSchema(input.results)
        } catch (e) {
          if (e instanceof Automate.UnformattableResultsSchemaError) {
            errorsByRunId[input.functionRunId] = `Invalid results schema: ${e.message}`
            continue
          } else {
            throw e
          }
        }
      }

      if (input.contextView) {
        try {
          validateContextView(input.contextView)
        } catch (e) {
          if (e instanceof FunctionRunReportStatusesError) {
            errorsByRunId[input.functionRunId] = `Invalid contextView: ${e.message}`
            continue
          } else {
            throw e
          }
        }
      }

      validatedUpdates.push({ update: input, run, newStatus })
    }

    // Group by automation run
    const groupedRuns = groupBy(validatedUpdates, (r) => r.run.runId)
    for (const [runId, updates] of Object.entries(groupedRuns)) {
      try {
        // Taking all function run statuses into account when calculating new automation status,
        // even function run statuses that were not updated in this call
        const preexistingFunctionRuns = allAutomationRunFunctionRuns[runId] || {}
        const finalFunctionRunStatuses = {
          ...mapValues(preexistingFunctionRuns, (r) => r.status),
          ...reduce(
            updates,
            (acc, u) => {
              acc[u.update.functionRunId] = u.newStatus
              return acc
            },
            {} as Record<string, AutomationRunStatus>
          )
        }

        const newAutomationStatus = resolveStatusFromFunctionRunStatuses(
          Object.values(finalFunctionRunStatuses)
        )

        // Update function runs
        const updatedFnRuns = await Promise.all(
          updates.map((u) =>
            updateFunctionRun({
              id: u.update.functionRunId,
              status: u.newStatus,
              ...(u.update.contextView?.length
                ? { contextView: u.update.contextView }
                : {}),
              ...(u.update.results
                ? { results: u.update.results as Automate.AutomateTypes.ResultsSchema }
                : {}),
              ...(u.update.statusMessage?.length
                ? { statusMessage: u.update.statusMessage }
                : {})
            })
          )
        )

        // Update automation run
        const updatedRun = await updateAutomationRun({
          id: runId,
          status: newAutomationStatus,
          updatedAt: new Date()
        })

        // Collect all function runs together in one array
        const updatedRunIds = updatedFnRuns.map((r) => r.id)
        const allFnRuns: typeof updatedFnRuns = [
          ...updatedFnRuns,
          ...Object.values(preexistingFunctionRuns).filter(
            (r) => !updatedRunIds.includes(r.id)
          )
        ]

        await AutomateRunsEmitter.emit(AutomateRunsEmitter.events.StatusUpdated, {
          run: updatedRun,
          functionRuns: allFnRuns
        })
      } catch (e) {
        automateLogger.error('Automation run status update failed', e, {
          runId,
          updates
        })

        for (const update of updates) {
          errorsByRunId[
            update.update.functionRunId
          ] = `Unexpectedly failed to update status`
        }
        continue
      }
    }

    const successfulUpdates = difference(
      validatedUpdates.map((u) => u.update.functionRunId),
      Object.keys(errorsByRunId)
    )

    return {
      successfullyUpdatedFunctionRunIds: successfulUpdates,
      errorsByFunctionRunId: errorsByRunId
    }
  }
