import { FunctionRunReportStatusesError } from '@/modules/automate/errors/runs'
import {
  AutomationRunStatus,
  AutomationRunStatuses
} from '@/modules/automate/helpers/types'
import { getFunctionRuns } from '@/modules/automate/repositories/automations'
import {
  AutomateFunctionRunStatusReportInput,
  AutomateRunStatus
} from '@/modules/core/graph/generated/graphql'
import { groupBy, keyBy, uniqBy } from 'lodash'

const AutomationRunStatusOrder: Array<AutomationRunStatus | AutomationRunStatus[]> = [
  AutomationRunStatuses.pending,
  AutomationRunStatuses.running,
  [
    AutomationRunStatuses.error,
    AutomationRunStatuses.failure,
    AutomationRunStatuses.success
  ]
]

const mapGqlStatusToDbStatus = (status: AutomateRunStatus) => {
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

const validateStatusChange = (
  previousStatus: AutomationRunStatus,
  newStatus: AutomationRunStatus
) => {
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

export type ReportFunctionRunStatusesDeps = {
  getFunctionRuns: typeof getFunctionRuns
}

export const reportFunctionRunStatuses =
  (deps: ReportFunctionRunStatusesDeps) =>
  async (params: { inputs: AutomateFunctionRunStatusReportInput[] }) => {
    const { inputs } = params
    const { getFunctionRuns } = deps

    const uniqueInputs = uniqBy(inputs, (i) => i.functionRunId)
    const existingRuns = keyBy(
      await getFunctionRuns({
        functionRunIds: uniqueInputs.map((i) => i.functionRunId)
      }),
      (r) => r.id
    )

    const runDataItems: Array<{
      update: AutomateFunctionRunStatusReportInput
      run: (typeof existingRuns)[0]
    }> = []
    for (const input of uniqueInputs) {
      const run = existingRuns[input.functionRunId]
      if (!run) {
        throw new FunctionRunReportStatusesError('Some function runs do not exist')
      }

      validateStatusChange(run.status, mapGqlStatusToDbStatus(input.status))

      runDataItems.push({ update: input, run })
    }

    // Group by automation run
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const groupedRuns = groupBy(runDataItems, (r) => r.run.runId)
  }
