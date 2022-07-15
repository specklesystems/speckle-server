const {
  saveActivity,
  ResourceTypes,
  ActionTypes
} = require('@/modules/activitystream/services')
const { pubsub, StreamPubsubEvents } = require('@/modules/shared')

/**
 * Save "stream permissions granted to user" activity item
 */
async function addStreamPermissionsAddedActivity({
  streamId,
  activityUserId,
  targetUserId,
  role,
  fromInvite
}) {
  await Promise.all([
    saveActivity({
      streamId,
      resourceType: ResourceTypes.Stream,
      resourceId: streamId,
      actionType: ActionTypes.Stream.PermissionsAdd,
      userId: activityUserId,
      info: { targetUser: targetUserId, role, fromInvite: !!fromInvite },
      message: `Permission granted to user ${targetUserId} (${role})`
    }),
    pubsub.publish(StreamPubsubEvents.UserStreamAdded, {
      userStreamAdded: {
        id: streamId,
        sharedBy: activityUserId
      },
      ownerId: targetUserId
    })
  ])
}

/**
 * Save "stream permissions revoked for user" activity item
 */
async function addStreamPermissionsRevokedActivity({
  streamId,
  activityUserId,
  removedUserId
}) {
  await Promise.all([
    saveActivity({
      streamId,
      resourceType: ResourceTypes.Stream,
      resourceId: streamId,
      actionType: ActionTypes.Stream.PermissionsRemove,
      userId: activityUserId,
      info: { targetUser: removedUserId },
      message: `Permission revoked for user ${removedUserId}`
    }),

    pubsub.publish(StreamPubsubEvents.UserStreamRemoved, {
      userStreamRemoved: {
        id: streamId,
        revokedBy: activityUserId
      },
      ownerId: removedUserId
    })
  ])
}

module.exports = {
  addStreamPermissionsAddedActivity,
  addStreamPermissionsRevokedActivity
}
