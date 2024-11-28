import {
  GetFullAutomationRevisionMetadata,
  GetFullAutomationRunById
} from '@/modules/automate/domain/operations'
import { InsertableAutomationRun } from '@/modules/automate/repositories/automations'
import { GetCommit } from '@/modules/core/domain/commits/operations'
import { LegacyGetUser } from '@/modules/core/domain/users/operations'
import { throwUncoveredError } from '@speckle/shared'

export type AutomateTrackingDeps = {
  getFullAutomationRevisionMetadata: GetFullAutomationRevisionMetadata
  getFullAutomationRunById: GetFullAutomationRunById
  getCommit: GetCommit
  getUser: LegacyGetUser
}

export const getUserEmailFromAutomationRunFactory =
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
          const user = await deps.getUser(userId)
          if (user) userEmail = user.email
        }

        break
      }
      default:
        throwUncoveredError(trigger.triggerType)
    }
    return userEmail
  }
