const { authorizeResolver } = require(`@/modules/shared`)

const { Roles } = require('@/modules/core/helpers/mainConstants')
const { LogicError } = require('@/modules/shared/errors')
const { ForbiddenError, UserInputError } = require('apollo-server-express')
const {
  StreamInvalidAccessError,
  StreamAccessUpdateError
} = require('@/modules/core/errors/stream')
const {
  addStreamPermissionsAddedActivity,
  addStreamPermissionsRevokedActivity,
  addStreamInviteAcceptedActivity
} = require('@/modules/activitystream/services/streamActivity')
const {
  getStream,
  revokeStreamPermissions,
  grantStreamPermissions
} = require('@/modules/core/repositories/streams')

const { ServerAcl } = require('@/modules/core/dbSchema')
const { ensureError } = require('@speckle/shared')

/**
 * Check if user is a stream collaborator
 * @param {string} userId
 * @param {string} streamId
 * @returns
 */
async function isStreamCollaborator(userId, streamId) {
  const stream = await getStream({ streamId, userId })
  return !!stream.role
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
 * @param {import('@/modules/core/domain/tokens/types').TokenResourceIdentifier[] | undefined | null} [userResourceAccessLimits]
 * @returns {Promise<boolean>}
 */
async function validateStreamAccess(
  userId,
  streamId,
  expectedRole,
  userResourceAccessLimits
) {
  expectedRole = expectedRole || Roles.Stream.Reviewer

  const streamRoles = Object.values(Roles.Stream)
  if (!streamRoles.includes(expectedRole)) {
    throw new LogicError('Unexpected stream role')
  }

  userId = userId || null

  try {
    await authorizeResolver(userId, streamId, expectedRole, userResourceAccessLimits)
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
 * @param {import('@/modules/core/domain/tokens/types').TokenResourceIdentifier[] | undefined | null} [removerResourceAccessRules] Resource access rules (if any) for the user doing the removing
 */
async function removeStreamCollaborator(
  streamId,
  userId,
  removedById,
  removerResourceAccessRules
) {
  if (userId !== removedById) {
    // User must be a stream owner to remove others
    await validateStreamAccess(
      removedById,
      streamId,
      Roles.Stream.Owner,
      removerResourceAccessRules
    )
  } else {
    // User must have any kind of role to remove himself
    const isCollaborator = await isStreamCollaborator(userId, streamId)
    if (!isCollaborator) {
      throw new StreamAccessUpdateError('User is not a stream collaborator')
    }
  }

  const stream = await revokeStreamPermissions({ streamId, userId })

  await addStreamPermissionsRevokedActivity({
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
 * @param {import('@/modules/core/domain/tokens/types').TokenResourceIdentifier[] | undefined | null} [adderResourceAccessRules] Resource access rules (if any) for the user doing the adding
 * @param {{
 *  fromInvite?: boolean,
 * }} param4
 */
async function addOrUpdateStreamCollaborator(
  streamId,
  userId,
  role,
  addedById,
  adderResourceAccessRules,
  { fromInvite } = {}
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

  await validateStreamAccess(
    addedById,
    streamId,
    Roles.Stream.Owner,
    adderResourceAccessRules
  )

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

module.exports = {
  validateStreamAccess,
  removeStreamCollaborator,
  addOrUpdateStreamCollaborator,
  isStreamCollaborator
}
