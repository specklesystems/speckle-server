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
  getFullAutomationRevisionMetadata,
  getFullAutomationRunById
} from '@/modules/automate/repositories/automations'
import { getCommit } from '@/modules/core/repositories/commits'
import { getUserById } from '@/modules/core/services/users'
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

export type AutomateTrackingDeps = {
  getFullAutomationRevisionMetadata: typeof getFullAutomationRevisionMetadata
  getFullAutomationRunById: typeof getFullAutomationRunById
  getCommit: typeof getCommit
  getUserById: typeof getUserById
}

const onAutomationRunStatusUpdated =
  (deps: AutomateTrackingDeps) =>
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

    const automationWithRevision = await deps.getFullAutomationRevisionMetadata(
      run.automationRevisionId
    )
    const fullRun = await deps.getFullAutomationRunById(run.id)
    if (!fullRun) throw new Error('This should never happen')

    if (!automationWithRevision) {
      automateLogger.error(
        {
          run
        },
        'Run revision not found unexpectedly'
      )
      return
    }

    const userEmail = await getUserEmailFromAutomationRun(deps)(
      fullRun,
      automationWithRevision.projectId
    )

    const mp = mixpanel({ userEmail, req: undefined })
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

const getUserEmailFromAutomationRun =
  (deps: AutomateTrackingDeps) =>
  async (
    automationRun: Pick<InsertableAutomationRun, 'triggers'>,
    projectId: string
  ): Promise<string | undefined> => {
    let userEmail: string | undefined = undefined
    const trigger = automationRun.triggers[0]
    switch (trigger.triggerType) {
      case 'versionCreation': {
        const version = await deps.getCommit(trigger.triggeringId, {
          streamId: projectId
        })
        if (!version) throw new Error("Version doesn't exist any more")
        const userId = version.author
        if (userId) {
          const user = await deps.getUserById({ userId })
          if (user) userEmail = user.email
        }

        break
      }
      default:
        throwUncoveredError(trigger.triggerType)
    }
    return userEmail
  }

const onRunCreated =
  (deps: AutomateTrackingDeps) =>
  async ({
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
        const userEmail = await getUserEmailFromAutomationRun(deps)(
          automationRun,
          automation.projectId
        )
        const mp = mixpanel({ userEmail, req: undefined })
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

export const setupRunFinishedTracking = (deps: AutomateTrackingDeps) => () => {
  const quitters = [
    AutomateRunsEmitter.listen(
      AutomateRunsEmitter.events.StatusUpdated,
      onAutomationRunStatusUpdated(deps)
    ),
    AutomateRunsEmitter.listen(AutomateRunsEmitter.events.Created, onRunCreated(deps))
  ]

  return () => quitters.forEach((quitter) => quitter())
}
