const { saveActivity } = require('@/modules/activitystream/services')
const { pubsub, StreamPubsubEvents } = require('@/modules/shared')
const {
  ResourceTypes,
  ActionTypes
} = require('@/modules/activitystream/services/types')

/**
 * Save "stream permissions granted to user" activity item
 */
async function addStreamPermissionsAddedActivity({
  streamId,
  activityUserId,
  targetUserId,
  role
}) {
  await Promise.all([
    saveActivity({
      streamId,
      resourceType: ResourceTypes.Stream,
      resourceId: streamId,
      actionType: ActionTypes.Stream.PermissionsAdd,
      userId: activityUserId,
      info: { targetUser: targetUserId, role },
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
 * Save "user accepted stream invite" activity item
 */
async function addStreamInviteAcceptedActivity({
  streamId,
  inviteTargetId,
  inviterId,
  role
}) {
  await Promise.all([
    saveActivity({
      streamId,
      resourceType: ResourceTypes.Stream,
      resourceId: streamId,
      actionType: ActionTypes.Stream.InviteAccepted,
      userId: inviteTargetId,
      info: { inviterUser: inviterId, role },
      message: `User ${inviteTargetId} has accepted an invitation to become a ${role}`
    }),
    pubsub.publish(StreamPubsubEvents.UserStreamAdded, {
      userStreamAdded: {
        id: streamId,
        sharedBy: inviterId
      },
      ownerId: inviteTargetId
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
  const isVoluntaryLeave = activityUserId === removedUserId

  await Promise.all([
    saveActivity({
      streamId,
      resourceType: ResourceTypes.Stream,
      resourceId: streamId,
      actionType: ActionTypes.Stream.PermissionsRemove,
      userId: activityUserId,
      info: { targetUser: removedUserId },
      message: isVoluntaryLeave
        ? `User ${removedUserId} left the stream`
        : `Permission revoked for user ${removedUserId}`
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

/**
 * Save "user invited another user to stream" activity item
 */
async function addStreamInviteSentOutActivity({
  streamId,
  inviteTargetId,
  inviterId,
  inviteTargetEmail
}) {
  const targetDisplay = inviteTargetId || inviteTargetEmail

  await saveActivity({
    streamId,
    resourceType: ResourceTypes.Stream,
    resourceId: streamId,
    actionType: ActionTypes.Stream.InviteSent,
    userId: inviterId,
    message: `User ${inviterId} has invited ${targetDisplay} to stream ${streamId}`,
    info: { targetId: inviteTargetId || null, targetEmail: inviteTargetEmail || null }
  })
}

/**
 * Save "user declined an invite" activity item
 */
async function addStreamInviteDeclinedActivity({
  streamId,
  inviteTargetId,
  inviterId
}) {
  await saveActivity({
    streamId,
    resourceType: ResourceTypes.Stream,
    resourceId: streamId,
    actionType: ActionTypes.Stream.InviteDeclined,
    userId: inviteTargetId,
    message: `User ${inviteTargetId} declined to join the stream ${streamId}`,
    info: { targetId: inviteTargetId, inviterId }
  })
}

module.exports = {
  addStreamPermissionsAddedActivity,
  addStreamPermissionsRevokedActivity,
  addStreamInviteAcceptedActivity,
  addStreamInviteSentOutActivity,
  addStreamInviteDeclinedActivity
}
