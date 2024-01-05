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
