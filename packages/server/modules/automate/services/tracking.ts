import { automateLogger } from '@/logging/logging'
import { AutomateRunsEmitter } from '@/modules/automate/events/runs'
import {
  AutomationFunctionRunRecord,
  AutomationRunRecord,
  AutomationRunStatus,
  AutomationRunStatuses,
  AutomationWithRevision,
  RunTriggerSource
} from '@/modules/automate/helpers/types'
import {
  InsertableAutomationRun,
  getFullAutomationRevisionMetadata
} from '@/modules/automate/repositories/automations'
import { mixpanel } from '@/modules/shared/utils/mixpanel'
import { throwUncoveredError } from '@speckle/shared'
import dayjs from 'dayjs'

const isFinished = (runStatus: AutomationRunStatus) => {
  const finishedStatuses: AutomationRunStatus[] = [
    AutomationRunStatuses.succeeded,
    AutomationRunStatuses.failed,
    AutomationRunStatuses.exception,
    AutomationRunStatuses.timeout,
    AutomationRunStatuses.canceled
  ]

  return finishedStatuses.includes(runStatus)
}

export type SetupRunFinishedTrackingDeps = {
  getFullAutomationRevisionMetadata: typeof getFullAutomationRevisionMetadata
}

const onAutomationRunStatusUpdated =
  ({ getFullAutomationRevisionMetadata }: SetupRunFinishedTrackingDeps) =>
  async ({
    run,
    functionRun,
    automationId
  }: {
    run: AutomationRunRecord
    functionRun: AutomationFunctionRunRecord
    automationId: string
  }) => {
    if (!isFinished(run.status)) return

    const automationWithRevision = await getFullAutomationRevisionMetadata(
      run.automationRevisionId
    )
    if (!automationWithRevision) {
      automateLogger.error(
        {
          run
        },
        'Run revision not found unexpectedly'
      )
      return
    }

    const mp = mixpanel({ userEmail: undefined })
    await mp.track('Automate Function Run Finished', {
      automationId,
      automationRevisionId: automationWithRevision.id,
      automationName: automationWithRevision.name,
      runId: run.id,
      functionRunId: functionRun.id,
      status: functionRun.status,
      durationInSeconds: dayjs(functionRun.updatedAt).diff(
        functionRun.createdAt,
        'second'
      )
    })
  }

const onRunCreated = async ({
  automation,
  run: automationRun,
  source
}: {
  automation: AutomationWithRevision
  run: InsertableAutomationRun
  source: RunTriggerSource
}) => {
  // all triggers, that are automatic result of an action are in a need to be tracked
  switch (source) {
    case RunTriggerSource.Automatic: {
      const mp = mixpanel({ userEmail: undefined })
      await mp.track('Automation Run Triggered', {
        automationId: automation.id,
        automationName: automation.name,
        automationRunId: automationRun.id,
        projectId: automation.projectId,
        source
      })
      break
    }
    // runs created from a user interaction are tracked in the frontend
    case RunTriggerSource.Manual:
      return
    default:
      throwUncoveredError(source)
  }
}

export const setupRunFinishedTracking = (deps: SetupRunFinishedTrackingDeps) => () => {
  const quitters = [
    AutomateRunsEmitter.listen(
      AutomateRunsEmitter.events.StatusUpdated,
      onAutomationRunStatusUpdated(deps)
    ),
    AutomateRunsEmitter.listen(AutomateRunsEmitter.events.Created, onRunCreated)
  ]

  return () => quitters.forEach((quitter) => quitter())
}
