import { ProjectEvents } from '@/modules/core/domain/projects/events'
import {
  AddOrUpdateStreamCollaborator,
  GetStream,
  GetStreamRoles,
  GrantStreamPermissions,
  IsStreamCollaborator,
  RemoveStreamCollaborator,
  RevokeStreamPermissions,
  SetStreamCollaborator,
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
import { DependenciesOf } from '@/modules/shared/helpers/factory'
import { EventBusEmit } from '@/modules/shared/services/eventBus'
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
    getStreamRoles: GetStreamRoles
    emitEvent: EventBusEmit
  }): RemoveStreamCollaborator =>
  async (streamId, userId, removedById, removerResourceAccessRules, options) => {
    if (!options?.skipAuthorization) {
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
    }

    const { [streamId]: role } = await deps.getStreamRoles(userId, [streamId])
    const stream = await deps.revokeStreamPermissions({ streamId, userId }, options)
    if (!stream) {
      throw new LogicError('Stream not found')
    }

    if (role) {
      await deps.emitEvent({
        eventName: ProjectEvents.PermissionsRevoked,
        payload: {
          project: stream,
          activityUserId: removedById,
          removedUserId: userId,
          role
        }
      })
    }

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
    getStreamRoles: GetStreamRoles
    emitEvent: EventBusEmit
  }): AddOrUpdateStreamCollaborator =>
  async (
    streamId,
    userId,
    role,
    addedById,
    adderResourceAccessRules,
    { fromInvite, trackProjectUpdate, skipAuthorization } = {}
  ) => {
    const validRoles = Object.values(Roles.Stream) as string[]
    if (!validRoles.includes(role)) {
      throw new LogicError('Unexpected stream role')
    }

    if (!skipAuthorization) {
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
    }

    // make sure server guests cannot be stream owners
    if (role === Roles.Stream.Owner) {
      const user = await deps.getUser(userId, { withRole: true })
      if (user?.role === Roles.Server.Guest)
        throw new BadRequestError('Server guests cannot own streams')
    }

    // Allows for dynamic extra validation
    await deps.emitEvent({
      eventName: ProjectEvents.PermissionsBeingAdded,
      payload: {
        activityUserId: addedById,
        targetUserId: userId,
        role: role as StreamRoles,
        projectId: streamId,
        fromInvite
      }
    })

    const { [streamId]: previousRole } = await deps.getStreamRoles(userId, [streamId])
    const stream = (await deps.grantStreamPermissions(
      {
        streamId,
        userId,
        role: role as StreamRoles
      },
      { trackProjectUpdate }
    )) as StreamRecord // validateStreamAccess already checked that it exists

    await deps.emitEvent({
      eventName: ProjectEvents.PermissionsAdded,
      payload: {
        project: stream,
        activityUserId: addedById,
        targetUserId: userId,
        role: role as StreamRoles,
        previousRole: previousRole || null
      }
    })

    return stream
  }

export const setStreamCollaboratorFactory =
  (
    deps: DependenciesOf<typeof addOrUpdateStreamCollaboratorFactory> &
      DependenciesOf<typeof removeStreamCollaboratorFactory>
  ): SetStreamCollaborator =>
  async (params, options) => {
    const addOrUpdateStreamCollaborator = addOrUpdateStreamCollaboratorFactory(deps)
    const removeStreamCollaborator = removeStreamCollaboratorFactory(deps)

    const { streamId, userId, role, setterResourceAccessRules, setByUserId } = params
    if (role) {
      return await addOrUpdateStreamCollaborator(
        streamId,
        userId,
        role,
        setByUserId,
        setterResourceAccessRules,
        options
      )
    } else {
      return await removeStreamCollaborator(
        streamId,
        userId,
        setByUserId,
        setterResourceAccessRules,
        options
      )
    }
  }
