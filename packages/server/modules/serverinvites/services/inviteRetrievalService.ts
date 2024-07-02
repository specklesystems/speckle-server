import { ServerInviteGraphQLReturnType } from '@/modules/core/helpers/graphTypes'
import { LimitedUserRecord } from '@/modules/core/helpers/types'
import { removePrivateFields } from '@/modules/core/helpers/userHelper'
import { getUsers, getUser } from '@/modules/core/repositories/users'
import { NoInviteFoundError } from '@/modules/serverinvites/errors'
import { PendingStreamCollaboratorGraphQLReturn } from '@/modules/serverinvites/helpers/graphTypes'
import {
  resolveTarget,
  resolveInviteTargetTitle,
  buildUserTarget
} from '@/modules/serverinvites/helpers/inviteHelper'
import {
  ServerInviteRecord,
  StreamInviteRecord
} from '@/modules/serverinvites/domain/types'
import { MaybeNullOrUndefined, Nullable, Roles } from '@speckle/shared'
import { keyBy, uniq } from 'lodash'
import {
  FindServerInvite,
  FindStreamInvite,
  QueryAllStreamInvites,
  QueryAllUserStreamInvites
} from '@/modules/serverinvites/domain/operations'

/**
 * The token field is intentionally ommited from this and only managed through the .token resolver
 * for extra security - so that no one accidentally returns it out from this service
 */
type PendingStreamCollaboratorGraphQLType = PendingStreamCollaboratorGraphQLReturn

function buildPendingStreamCollaboratorId(invite: ServerInviteRecord) {
  return `invite:${invite.id}`
}

function buildPendingStreamCollaboratorModel(
  invite: StreamInviteRecord,
  targetUser: Nullable<LimitedUserRecord>
): PendingStreamCollaboratorGraphQLType {
  const { resourceId } = invite

  return {
    id: buildPendingStreamCollaboratorId(invite),
    inviteId: invite.id,
    streamId: resourceId,
    title: resolveInviteTargetTitle(invite, targetUser),
    role: invite.role || Roles.Stream.Contributor,
    invitedById: invite.inviterId,
    user: targetUser
  }
}

/**
 * Get all registered invitation target users keyed by their ID
 */
async function getInvitationTargetUsers(invites: ServerInviteRecord[]) {
  const userIds = uniq(
    invites
      .map((i) => resolveTarget(i.target).userId)
      .filter((id): id is NonNullable<typeof id> => !!id)
  )
  if (!userIds.length) return {}

  const users = await getUsers(userIds)
  return keyBy(users, 'id')
}

/**
 * Get pending stream collaborators (invited, but not accepted)
 */
export const getPendingStreamCollaboratorsFactory =
  ({ queryAllStreamInvites }: { queryAllStreamInvites: QueryAllStreamInvites }) =>
  async (streamId: string): Promise<PendingStreamCollaboratorGraphQLType[]> => {
    // Get all pending invites
    const invites = await queryAllStreamInvites(streamId)

    // Get all target users, if any
    const usersById = await getInvitationTargetUsers(invites)

    // Build results
    const results = []
    for (const invite of invites) {
      let user: LimitedUserRecord | null = null
      const { userId } = resolveTarget(invite.target)
      if (userId && usersById[userId]) {
        user = removePrivateFields(usersById[userId])
      }

      results.push(buildPendingStreamCollaboratorModel(invite, user))
    }

    return results
  }

/**
 * Find a pending invitation to the specified stream for the specified user
 * Either the user ID or invite ID must be set
 */
export const getUserPendingStreamInviteFactory =
  ({ findStreamInvite }: { findStreamInvite: FindStreamInvite }) =>
  async (
    streamId: string,
    userId: MaybeNullOrUndefined<string>,
    token: MaybeNullOrUndefined<string>
  ): Promise<Nullable<PendingStreamCollaboratorGraphQLType>> => {
    if (!userId && !token) return null

    const invite = await findStreamInvite(streamId, {
      target: buildUserTarget(userId),
      token
    })
    if (!invite) return null

    const targetUserId = resolveTarget(invite.target).userId
    // TODO: user repo should be injected
    const targetUser = targetUserId ? await getUser(targetUserId) : null

    return buildPendingStreamCollaboratorModel(invite, targetUser)
  }

/**
 * Get all pending invitations to streams that this user has
 */
export const getUserPendingStreamInvitesFactory =
  ({
    queryAllUserStreamInvites
  }: {
    queryAllUserStreamInvites: QueryAllUserStreamInvites
  }) =>
  async (userId: string): Promise<PendingStreamCollaboratorGraphQLType[]> => {
    if (!userId) return []

    // TODO: user repository should be injected
    const targetUser = await getUser(userId)
    if (!targetUser) {
      throw new NoInviteFoundError('Nonexistant user specified')
    }

    const invites = await queryAllUserStreamInvites(userId)
    return invites.map((i) => buildPendingStreamCollaboratorModel(i, targetUser))
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
