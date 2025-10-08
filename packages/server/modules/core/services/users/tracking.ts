import type { updateMailchimpMemberTags } from '@/modules/auth/services/mailchimp'
import type { GetUserAuthoredCommitCounts } from '@/modules/core/domain/commits/operations'
import type { GetImplicitUserProjectsCountFactory } from '@/modules/core/domain/streams/operations'
import type {
  GetUser,
  SetUserOnboardingChoices,
  UpdateUserMixpanelProfile
} from '@/modules/core/domain/users/operations'
import type {
  getMailchimpOnboardingIds,
  getMailchimpStatus
} from '@/modules/shared/helpers/envHelper'
import type { getMixpanelClient } from '@/modules/shared/utils/mixpanel'
import type { GetUserWorkspaceCountFactory } from '@/modules/workspacesCore/domain/operations'
import { resolveDistinctId } from '@speckle/shared'
import type { Logger } from 'pino'

export const updateUserMixpanelProfileFactory =
  (deps: {
    getUser: GetUser
    getImplicitUserProjectsCount: GetImplicitUserProjectsCountFactory
    getUserWorkspaceCount: GetUserWorkspaceCountFactory
    getUserAuthoredCommitCounts: GetUserAuthoredCommitCounts
    getMixpanelClient: typeof getMixpanelClient
    logger: Logger
  }): UpdateUserMixpanelProfile =>
  async (params) => {
    const mp = deps.getMixpanelClient()
    if (!mp) return

    const user = await deps.getUser(params.userId, { withRole: true })
    if (!user) {
      return
    }

    const [totalStreams, totalWorkspaces, totalCommits] = await Promise.all([
      deps.getImplicitUserProjectsCount({
        userId: user.id
      }),
      deps.getUserWorkspaceCount({
        userId: user.id
      }),
      deps
        .getUserAuthoredCommitCounts({
          userIds: [user.id]
        })
        .then((res) => res[user.id] || 0)
    ])

    const properties = {
      $name: user.name,
      $email: user.email,
      Company: user.company,
      'Registered At': user.createdAt,
      Identified: true,
      'Total Streams': totalStreams,
      'Total Workspaces': totalWorkspaces,
      'Total Commits': totalCommits
    }

    const distinctId = resolveDistinctId(user.email)
    mp.people.set(distinctId, properties)
    deps.logger.info(properties, 'Updated user mp profile')
  }

export const setUserOnboardingChoicesFactory =
  (deps: {
    getUser: GetUser
    updateMailchimpMemberTags: typeof updateMailchimpMemberTags
    getMixpanelClient: typeof getMixpanelClient
    getMailchimpStatus: typeof getMailchimpStatus
    getMailchimpOnboardingIds: typeof getMailchimpOnboardingIds
  }): SetUserOnboardingChoices =>
  async ({ userId, choices }) => {
    const isMailchimpEnabled = deps.getMailchimpStatus()
    const mp = deps.getMixpanelClient()
    if (!mp && !isMailchimpEnabled) return

    const user = await deps.getUser(userId, { withRole: true })
    if (!user) return

    // Sync to mailchimp
    if (isMailchimpEnabled) {
      const { listId } = deps.getMailchimpOnboardingIds()
      await deps.updateMailchimpMemberTags(user, listId, choices)
    }

    // Sync to mixpanel
    if (mp) {
      const properties = {
        'Use Case': choices.plans,
        Role: choices.role,
        Source: choices.source
      }

      const distinctId = resolveDistinctId(user.email)
      mp.people.set(distinctId, properties)
    }
  }
