import type {
  GetFullAutomationRevisionMetadata,
  GetFullAutomationRunById
} from '@/modules/automate/domain/operations'
import type { InsertableAutomationRun } from '@/modules/automate/repositories/automations'
import type { GetCommit } from '@/modules/core/domain/commits/operations'
import type { LegacyGetUser } from '@/modules/core/domain/users/operations'
import { CommitNotFoundError } from '@/modules/core/errors/commit'
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
        if (!version) throw new CommitNotFoundError("Version doesn't exist any more")
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
