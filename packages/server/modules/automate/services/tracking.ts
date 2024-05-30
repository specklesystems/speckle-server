import { automateLogger } from '@/logging/logging'
import { AutomateRunsEmitter } from '@/modules/automate/events/runs'
import {
  AutomationRunStatus,
  AutomationRunStatuses
} from '@/modules/automate/helpers/types'
import { getFullAutomationRevisionMetadata } from '@/modules/automate/repositories/automations'
import { mixpanel } from '@/modules/shared/utils/mixpanel'
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

export const setupRunFinishedTracking = (deps: SetupRunFinishedTrackingDeps) => () => {
  const { getFullAutomationRevisionMetadata } = deps

  const quitters = [
    AutomateRunsEmitter.listen(
      AutomateRunsEmitter.events.StatusUpdated,
      async ({ run, functionRun, automationId }) => {
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
    )
  ]

  return () => quitters.forEach((quitter) => quitter())
}
