import { ServerInviteGraphQLReturnType } from '@/modules/core/helpers/graphTypes'
import { resolveTarget } from '@/modules/serverinvites/helpers/core'
import { Nullable } from '@speckle/shared'
import { keyBy, uniq } from 'lodash'
import { FindServerInvite } from '@/modules/serverinvites/domain/operations'
import { GetInvitationTargetUsers } from '@/modules/serverinvites/services/operations'
import { GetUsers } from '@/modules/core/domain/users/operations'

/**
 * Get all registered invitation target users keyed by their ID
 */
export const getInvitationTargetUsersFactory =
  (deps: { getUsers: GetUsers }): GetInvitationTargetUsers =>
  async ({ invites }) => {
    const userIds = uniq(
      invites
        .map((i) => resolveTarget(i.target).userId)
        .filter((id): id is NonNullable<typeof id> => !!id)
    )
    if (!userIds.length) return {}

    const users = await deps.getUsers(userIds)
    return keyBy(users, 'id')
  }

export const getServerInviteForTokenFactory =
  ({ findServerInvite }: { findServerInvite: FindServerInvite }) =>
  async (token: string): Promise<Nullable<ServerInviteGraphQLReturnType>> => {
    const invite = await findServerInvite(undefined, token)
    if (!invite) return null

    const target = resolveTarget(invite.target)
    if (!target.userEmail) return null

    return {
      id: invite.id,
      invitedById: invite.inviterId,
      email: target.userEmail
    }
  }
