import { authorizeResolver } from '@/modules/shared'

import { Roles, StreamRoles } from '@/modules/core/helpers/mainConstants'
import { LogicError } from '@/modules/shared/errors'
import { ForbiddenError, UserInputError } from 'apollo-server-express'
import { StreamInvalidAccessError } from '@/modules/core/errors/stream'
import {
  addStreamPermissionsAddedActivity,
  addStreamPermissionsRevokedActivity,
  addStreamInviteAcceptedActivity
} from '@/modules/activitystream/services/streamActivity'
import {
  getStream,
  revokeStreamPermissions,
  grantStreamPermissions
} from '@/modules/core/repositories/streams'

import { ServerAcl } from '@/modules/core/dbSchema'

/**
 * Check if user is a stream collaborator
 * @param {string} userId
 * @param {string} streamId
 * @returns
 */
export async function isStreamCollaborator(userId: string, streamId: string) {
  const stream = await getStream({ streamId, userId })
  return !!stream?.role
}

/**
 * Validate that the user has the required permission level (or one above it) for the specified stream.
 *
 * Note: The access check can sometimes succeed even if the user being tested is a guest, e.g.
 * if the stream is public and we're only looking for stream:reviewer or up. If you want to check
 * that the target user is an actual collaborator, use isStreamCollaborator instead.
 * @param {string} [userId] If falsy, will throw for non-public streams
 * @param {string} streamId
 * @param {string} [expectedRole] Defaults to reviewer
 * @returns {Promise<boolean>}
 */
export async function validateStreamAccess(
  userId: string | undefined | null,
  streamId: string,
  expectedRole?: StreamRoles
) {
  expectedRole = expectedRole || Roles.Stream.Reviewer

  const streamRoles = Object.values(Roles.Stream)
  if (!streamRoles.includes(expectedRole)) {
    throw new LogicError('Unexpected stream role')
  }

  if (!userId) userId = null

  try {
    await authorizeResolver(userId, streamId, expectedRole)
  } catch (e) {
    if (e instanceof ForbiddenError) {
      throw new StreamInvalidAccessError(
        'User does not have required access to stream',
        {
          cause: e,
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
export async function removeStreamCollaborator(
  streamId: string,
  userId: string,
  removedById: string
) {
  if (userId !== removedById) {
    // User must be a stream owner to remove others
    await validateStreamAccess(removedById, streamId, Roles.Stream.Owner)
  } else {
    // User must have any kind of role to remove himself
    await isStreamCollaborator(userId, streamId)
  }

  const stream = await revokeStreamPermissions({ streamId, userId })

  await addStreamPermissionsRevokedActivity({
    streamId,
    activityUserId: removedById,
    removedUserId: userId
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
 * @param {{
 *  fromInvite?: boolean,
 * }} param4
 */
export async function addOrUpdateStreamCollaborator(
  streamId: string,
  userId: string,
  role: StreamRoles,
  addedById: string,
  { fromInvite } = { fromInvite: false }
) {
  const validRoles = Object.values(Roles.Stream)
  if (!validRoles.includes(role)) {
    throw new LogicError('Unexpected stream role')
  }

  if (userId === addedById) {
    throw new StreamInvalidAccessError(
      'User cannot change their own stream access level'
    )
  }

  await validateStreamAccess(addedById, streamId, Roles.Stream.Owner)

  // make sure server guests cannot be stream owners
  if (role === Roles.Stream.Owner) {
    const userServerRole = await ServerAcl.knex().where({ userId }).first()
    if (userServerRole.role === Roles.Server.Guest)
      throw new UserInputError('Server guests cannot own streams')
  }

  const stream = await grantStreamPermissions({
    streamId,
    userId,
    role
  })

  if (fromInvite) {
    await addStreamInviteAcceptedActivity({
      streamId,
      inviterId: addedById,
      inviteTargetId: userId,
      role,
      stream
    })
  } else {
    await addStreamPermissionsAddedActivity({
      streamId,
      activityUserId: addedById,
      targetUserId: userId,
      role,
      stream
    })
  }

  return stream
}
