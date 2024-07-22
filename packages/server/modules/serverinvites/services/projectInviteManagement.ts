import { TokenResourceIdentifier } from '@/modules/core/domain/tokens/types'
import { StreamInvalidAccessError } from '@/modules/core/errors/stream'
import {
  MutationStreamInviteUseArgs,
  ProjectInviteCreateInput,
  ProjectInviteUseInput,
  StreamInviteCreateInput
} from '@/modules/core/graph/generated/graphql'
import {
  ContextResourceAccessRules,
  isResourceAllowed
} from '@/modules/core/helpers/token'
import { LimitedUserRecord } from '@/modules/core/helpers/types'
import { removePrivateFields } from '@/modules/core/helpers/userHelper'
import { getUser, getUsers } from '@/modules/core/repositories/users'
import { ProjectInviteResourceType } from '@/modules/serverinvites/domain/constants'
import {
  CreateInviteParams,
  FindInvite,
  QueryAllResourceInvites,
  QueryAllUserResourceInvites
} from '@/modules/serverinvites/domain/operations'
import {
  ProjectInviteResourceTarget,
  ServerInviteRecord
} from '@/modules/serverinvites/domain/types'
import {
  InviteCreateValidationError,
  NoInviteFoundError
} from '@/modules/serverinvites/errors'
import {
  buildUserTarget,
  resolveInviteTargetTitle,
  resolveTarget
} from '@/modules/serverinvites/helpers/core'
import { PendingStreamCollaboratorGraphQLReturn } from '@/modules/serverinvites/helpers/graphTypes'
import {
  CreateAndSendInvite,
  FinalizeInvite,
  GetInvitationTargetUsers
} from '@/modules/serverinvites/services/operations'
import { MaybeNullOrUndefined, Nullable, Roles, StreamRoles } from '@speckle/shared'
import { has } from 'lodash'

type FullProjectInviteCreateInput = ProjectInviteCreateInput & { projectId: string }

const isStreamInviteCreateInput = (
  i: StreamInviteCreateInput | FullProjectInviteCreateInput
): i is StreamInviteCreateInput => has(i, 'streamId')

export const createProjectInviteFactory =
  (deps: { createAndSendInvite: CreateAndSendInvite }) =>
  async (
    input: StreamInviteCreateInput | FullProjectInviteCreateInput,
    inviterId: string,
    inviterResourceAccessRules: MaybeNullOrUndefined<TokenResourceIdentifier[]>
  ) => {
    const { email, userId, role } = input

    if (!email && !userId) {
      throw new InviteCreateValidationError('Either email or userId must be specified')
    }

    const target = (userId ? buildUserTarget(userId) : email)!
    await deps.createAndSendInvite(
      {
        target,
        inviterId,
        message: isStreamInviteCreateInput(input)
          ? input.message || undefined
          : undefined,
        primaryResourceTarget: {
          resourceType: ProjectInviteResourceType,
          resourceId: isStreamInviteCreateInput(input)
            ? input.streamId
            : input.projectId,
          role: role || Roles.Stream.Contributor,
          primary: true
        }
      },
      inviterResourceAccessRules
    )
  }

const isStreamInviteUseArgs = (
  i: MutationStreamInviteUseArgs | ProjectInviteUseInput
): i is MutationStreamInviteUseArgs => has(i, 'streamId')

export const useProjectInviteAndNotifyFactory =
  (deps: { finalizeInvite: FinalizeInvite }) =>
  async (
    input: MutationStreamInviteUseArgs | ProjectInviteUseInput,
    userId: string,
    userResourceAccessRules: ContextResourceAccessRules
  ) => {
    const { accept, token } = input

    if (
      !isResourceAllowed({
        resourceId: isStreamInviteUseArgs(input) ? input.streamId : input.projectId,
        resourceType: 'project',
        resourceAccessRules: userResourceAccessRules
      })
    ) {
      throw new StreamInvalidAccessError(
        'You are not allowed to process an invite for this project',
        {
          info: {
            userId,
            userResourceAccessRules,
            input
          }
        }
      )
    }

    await deps.finalizeInvite({
      accept,
      resourceType: ProjectInviteResourceType,
      token,
      finalizerUserId: userId
    })
  }

/**
 * Invite users to be contributors for the specified project
 */
export const inviteUsersToProjectFactory =
  (deps: { createAndSendInvite: CreateAndSendInvite; getUsers: typeof getUsers }) =>
  async (
    inviterId: string,
    streamId: string,
    userIds: string[],
    inviterResourceAccessLimits?: TokenResourceIdentifier[] | null
  ): Promise<boolean> => {
    const { createAndSendInvite, getUsers } = deps
    const users = await getUsers(userIds)
    if (!users.length) return false

    const inviteParamsArray = users.map(
      (u): CreateInviteParams => ({
        target: buildUserTarget(u.id)!,
        inviterId,
        primaryResourceTarget: {
          resourceType: ProjectInviteResourceType,
          resourceId: streamId,
          role: Roles.Stream.Contributor,
          primary: true
        }
      })
    )

    await Promise.all(
      inviteParamsArray.map((p) => createAndSendInvite(p, inviterResourceAccessLimits))
    )

    return true
  }

function buildPendingStreamCollaboratorId(invite: ServerInviteRecord) {
  return `invite:${invite.id}`
}

function buildPendingStreamCollaboratorModel(
  invite: ServerInviteRecord<ProjectInviteResourceTarget>,
  targetUser: Nullable<LimitedUserRecord>
): PendingStreamCollaboratorGraphQLReturn {
  return {
    id: buildPendingStreamCollaboratorId(invite),
    inviteId: invite.id,
    streamId: invite.resource.resourceId,
    title: resolveInviteTargetTitle(invite, targetUser),
    role: invite.resource.role || Roles.Stream.Contributor,
    invitedById: invite.inviterId,
    user: targetUser
  }
}

/**
 * Get all pending invitations to projects that this user has
 */
export const getUserPendingProjectInvitesFactory =
  (deps: {
    getUserResourceInvites: QueryAllUserResourceInvites
    getUser: typeof getUser
  }) =>
  async (userId: string): Promise<PendingStreamCollaboratorGraphQLReturn[]> => {
    if (!userId) return []

    const targetUser = await deps.getUser(userId)
    if (!targetUser) {
      throw new NoInviteFoundError('Nonexistant user specified')
    }

    const invites = await deps.getUserResourceInvites<
      typeof ProjectInviteResourceType,
      StreamRoles
    >({
      userId,
      resourceType: ProjectInviteResourceType
    })
    return invites.map((i) => buildPendingStreamCollaboratorModel(i, targetUser))
  }

/**
 * Find a pending invitation to the specified project for the specified user
 * Either the user ID or invite ID must be set
 */
export const getUserPendingProjectInviteFactory =
  (deps: { findInvite: FindInvite; getUser: typeof getUser }) =>
  async (
    projectId: string,
    userId: MaybeNullOrUndefined<string>,
    token: MaybeNullOrUndefined<string>
  ): Promise<Nullable<PendingStreamCollaboratorGraphQLReturn>> => {
    if (!userId && !token) return null

    const invite = await deps.findInvite<typeof ProjectInviteResourceType, StreamRoles>(
      {
        target: userId ? buildUserTarget(userId) : undefined,
        token: token || undefined,
        resourceFilter: {
          resourceType: ProjectInviteResourceType,
          resourceId: projectId
        }
      }
    )
    if (!invite) return null

    const targetUserId = resolveTarget(invite.target).userId
    const targetUser = targetUserId ? await deps.getUser(targetUserId) : null

    return buildPendingStreamCollaboratorModel(invite, targetUser)
  }

/**
 * Get pending project/stream collaborators (invited, but not accepted)
 */
export const getPendingProjectCollaboratorsFactory =
  (deps: {
    queryAllResourceInvites: QueryAllResourceInvites
    getInvitationTargetUsers: GetInvitationTargetUsers
  }) =>
  async (streamId: string): Promise<PendingStreamCollaboratorGraphQLReturn[]> => {
    // Get all pending invites
    const invites = await deps.queryAllResourceInvites<
      typeof ProjectInviteResourceType,
      StreamRoles
    >({
      resourceId: streamId,
      resourceType: ProjectInviteResourceType
    })

    // Get all target users, if any
    const usersById = await deps.getInvitationTargetUsers({ invites })

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
