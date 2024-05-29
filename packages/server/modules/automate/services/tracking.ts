import { automateLogger } from '@/logging/logging'
import { AutomateRunsEmitter } from '@/modules/automate/events/runs'
import {
  AutomationRunStatus,
  AutomationRunStatuses
} from '@/modules/automate/helpers/types'
import { getFullAutomationRevisionMetadata } from '@/modules/automate/repositories/automations'
import { getUser } from '@/modules/core/repositories/users'
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
  getUser: typeof getUser
  getFullAutomationRevisionMetadata: typeof getFullAutomationRevisionMetadata
}

export const setupRunFinishedTracking = (deps: SetupRunFinishedTrackingDeps) => () => {
  const { getUser, getFullAutomationRevisionMetadata } = deps

  const quitters = [
    AutomateRunsEmitter.listen(
      AutomateRunsEmitter.events.StatusUpdated,
      async ({ run }) => {
        if (!isFinished(run.status)) return

        const [user, automationWithRevision] = await Promise.all([
          run.triggeredByUserId ? await getUser(run.triggeredByUserId) : null,
          getFullAutomationRevisionMetadata(run.automationRevisionId)
        ])
        if (!automationWithRevision) {
          automateLogger.error(
            {
              run
            },
            'Run revision not found unexpectedly'
          )
          return
        }

        const mp = mixpanel({ userEmail: user?.email })
        await mp.track('Automation Run Finished', {
          automationId: automationWithRevision.id,
          automationName: automationWithRevision.name,
          runId: run.id,
          status: run.status,
          durationInSeconds: dayjs(run.updatedAt).diff(run.createdAt, 'second'),
          triggeredBy: run.triggeredByUserId
        })
      }
    )
  ]

  return () => quitters.forEach((quitter) => quitter())
}
