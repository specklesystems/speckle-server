const {
  revokePermissionsStream,
  grantPermissionsStream
} = require('@/modules/core/services/streams')
const { pubsub, StreamPubsubEvents, authorizeResolver } = require(`@/modules/shared`)
const {
  saveActivity,
  ResourceTypes,
  ActionTypes
} = require(`@/modules/activitystream/services`)
const { Roles } = require('@/modules/core/helpers/mainConstants')
const { LogicError } = require('@/modules/shared/errors')
const { ForbiddenError } = require('apollo-server-express')
const { StreamInvalidAccessError } = require('@/modules/core/errors/stream')

/**
 * Validate that the user has the required permission level (or one above it) for the specified stream
 * @param {string} userId
 * @param {string} streamId
 * @param {string} expectedRole
 * @returns {Promise<boolean>}
 */
async function validateStreamAccess(userId, streamId, expectedRole) {
  const streamRoles = Object.values(Roles.Stream)
  if (!streamRoles.includes(expectedRole)) {
    throw new LogicError('Unexpected stream role')
  }

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
async function removeStreamCollaborator(streamId, userId, removedById) {
  if (userId !== removedById) {
    // User must be a stream owner to remove others
    await validateStreamAccess(removedById, streamId, Roles.Stream.Owner)
  } else {
    // User must have any kind of role to remove himself
    await validateStreamAccess(removedById, streamId, Roles.Stream.Reviewer)
  }

  await revokePermissionsStream({ streamId, userId })

  await Promise.all([
    saveActivity({
      streamId,
      resourceType: ResourceTypes.Stream,
      resourceId: streamId,
      actionType: ActionTypes.Stream.PermissionsRemove,
      userId,
      info: { targetUser: removedById },
      message: `Permission revoked for user ${userId}`
    }),

    pubsub.publish(StreamPubsubEvents.UserStreamRemoved, {
      userStreamRemoved: {
        id: streamId,
        revokedBy: removedById
      },
      ownerId: userId
    })
  ])
}

/**
 * Add a new collaborator to the stream or update their access level
 * @param {string} streamId
 * @param {string} userId ID of user who is being added
 * @param {string} role
 * @param {string} addedById ID of user who is adding the new collaborator
 */
async function addOrUpdateStreamCollaborator(streamId, userId, role, addedById) {
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

  await grantPermissionsStream({
    streamId,
    userId,
    role
  })

  await Promise.all([
    saveActivity({
      streamId,
      resourceType: ResourceTypes.Stream,
      resourceId: streamId,
      actionType: ActionTypes.Stream.PermissionsAdd,
      userId: addedById,
      info: { targetUser: userId, role },
      message: `Permission granted to user ${userId} (${role})`
    }),
    pubsub.publish(StreamPubsubEvents.UserStreamAdded, {
      userStreamAdded: {
        id: streamId,
        sharedBy: addedById
      },
      ownerId: userId
    })
  ])
}

module.exports = {
  validateStreamAccess,
  removeStreamCollaborator,
  addOrUpdateStreamCollaborator
}
