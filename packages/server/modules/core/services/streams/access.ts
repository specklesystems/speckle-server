import {
  addStreamInviteAcceptedActivityFactory,
  addStreamPermissionsAddedActivityFactory,
  addStreamPermissionsRevokedActivityFactory
} from '@/modules/activitystream/services/streamActivity'
import {
  AddOrUpdateStreamCollaborator,
  GetStream,
  GrantStreamPermissions,
  IsStreamCollaborator,
  RemoveStreamCollaborator,
  RevokeStreamPermissions,
  ValidateStreamAccess
} from '@/modules/core/domain/streams/operations'
import { GetUser } from '@/modules/core/domain/users/operations'
import {
  StreamAccessUpdateError,
  StreamInvalidAccessError
} from '@/modules/core/errors/stream'
import { StreamRecord } from '@/modules/core/helpers/types'
import { AuthorizeResolver } from '@/modules/shared/domain/operations'
import { BadRequestError, ForbiddenError, LogicError } from '@/modules/shared/errors'
import { ensureError, Roles, StreamRoles } from '@speckle/shared'

/**
 * Check if user is a stream collaborator
 */
export const isStreamCollaboratorFactory =
  (deps: { getStream: GetStream }): IsStreamCollaborator =>
  async (userId, streamId) => {
    const stream = await deps.getStream({ streamId, userId })
    return !!stream?.role
  }

/**
 * Validate that the user has the required permission level (or one above it) for the specified stream.
 *
 * Note: The access check can sometimes succeed even if the user being tested is a guest, e.g.
 * if the stream is public and we're only looking for stream:reviewer or up. If you want to check
 * that the target user is an actual collaborator, use isStreamCollaborator instead.
 */
export const validateStreamAccessFactory =
  (deps: { authorizeResolver: AuthorizeResolver }): ValidateStreamAccess =>
  async (userId, streamId, expectedRole, userResourceAccessLimits) => {
    expectedRole = expectedRole || Roles.Stream.Reviewer

    const streamRoles = Object.values(Roles.Stream)
    if (!streamRoles.includes(expectedRole as StreamRoles)) {
      throw new LogicError('Unexpected stream role')
    }

    userId = userId || null

    try {
      await deps.authorizeResolver(
        userId,
        streamId,
        expectedRole as StreamRoles,
        userResourceAccessLimits
      )
    } catch (e) {
      if (
        e instanceof ForbiddenError ||
        /^resource of type streams .* not found$/i.test(ensureError(e).message)
      ) {
        throw new StreamInvalidAccessError(
          'User does not have required access to stream',
          {
            // cause: e, // We don't want to show the real cause to the user
            info: {
              userId,
              streamId,
              expectedRole
            }
          }
        )
      } else {
        throw e
      }
    }

    return true
  }

/**
 * Remove collaborator from stream
 * @param {string} streamId
 * @param {string} userId ID of user that should be removed
 * @param {string} removedById ID of user that is doing the removing
 */
export const removeStreamCollaboratorFactory =
  (deps: {
    validateStreamAccess: ValidateStreamAccess
    isStreamCollaborator: IsStreamCollaborator
    revokeStreamPermissions: RevokeStreamPermissions
    addStreamPermissionsRevokedActivity: ReturnType<
      typeof addStreamPermissionsRevokedActivityFactory
    >
  }): RemoveStreamCollaborator =>
  async (streamId, userId, removedById, removerResourceAccessRules) => {
    if (userId !== removedById) {
      // User must be a stream owner to remove others
      await deps.validateStreamAccess(
        removedById,
        streamId,
        Roles.Stream.Owner,
        removerResourceAccessRules
      )
    } else {
      // User must have any kind of role to remove himself
      const isCollaborator = await deps.isStreamCollaborator(userId, streamId)
      if (!isCollaborator) {
        throw new StreamAccessUpdateError('User is not a stream collaborator')
      }
    }

    const stream = await deps.revokeStreamPermissions({ streamId, userId })
    if (!stream) {
      throw new LogicError('Stream not found')
    }

    await deps.addStreamPermissionsRevokedActivity({
      streamId,
      activityUserId: removedById,
      removedUserId: userId,
      stream
    })

    return stream
  }

/**
 * Add a new collaborator to the stream or update their access level
 *
 * Optional parameters:
 * - fromInvite: Set to true, if user is being added as a result of accepting an invitation
 * @param {string} streamId
 * @param {string} userId ID of user who is being added
 * @param {string} role
 * @param {string} addedById ID of user who is adding the new collaborator
 */
export const addOrUpdateStreamCollaboratorFactory =
  (deps: {
    validateStreamAccess: ValidateStreamAccess
    getUser: GetUser
    grantStreamPermissions: GrantStreamPermissions
    addStreamInviteAcceptedActivity: ReturnType<
      typeof addStreamInviteAcceptedActivityFactory
    >
    addStreamPermissionsAddedActivity: ReturnType<
      typeof addStreamPermissionsAddedActivityFactory
    >
  }): AddOrUpdateStreamCollaborator =>
  async (
    streamId,
    userId,
    role,
    addedById,
    adderResourceAccessRules,
    { fromInvite } = {}
  ) => {
    const validRoles = Object.values(Roles.Stream) as string[]
    if (!validRoles.includes(role)) {
      throw new LogicError('Unexpected stream role')
    }

    if (userId === addedById) {
      throw new StreamInvalidAccessError(
        'User cannot change their own stream access level'
      )
    }

    await deps.validateStreamAccess(
      addedById,
      streamId,
      Roles.Stream.Owner,
      adderResourceAccessRules
    )

    // make sure server guests cannot be stream owners
    if (role === Roles.Stream.Owner) {
      const user = await deps.getUser(userId, { withRole: true })
      if (user?.role === Roles.Server.Guest)
        throw new BadRequestError('Server guests cannot own streams')
    }

    const stream = (await deps.grantStreamPermissions({
      streamId,
      userId,
      role: role as StreamRoles
    })) as StreamRecord // validateStreamAccess already checked that it exists

    if (fromInvite) {
      await deps.addStreamInviteAcceptedActivity({
        streamId,
        inviterId: addedById,
        inviteTargetId: userId,
        role: role as StreamRoles,
        stream
      })
    } else {
      await deps.addStreamPermissionsAddedActivity({
        streamId,
        activityUserId: addedById,
        targetUserId: userId,
        role: role as StreamRoles,
        stream
      })
    }

    return stream
  }
