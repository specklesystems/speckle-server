import {
  saveActivity,
  ResourceTypes,
  ActionTypes
} from '@/modules/activitystream/services'
import { StreamRoles } from '@/modules/core/helpers/mainConstants'
import { pubsub, StreamPubsubEvents } from '@/modules/shared'

/**
 * Save "stream permissions granted to user" activity item
 */
export async function addStreamPermissionsAddedActivity(params: {
  streamId: string
  activityUserId: string
  targetUserId: string
  role: StreamRoles
}) {
  const { streamId, activityUserId, targetUserId, role } = params
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
export async function addStreamInviteAcceptedActivity(params: {
  streamId: string
  inviteTargetId: string
  inviterId: string
  role: StreamRoles
}) {
  const { streamId, inviteTargetId, inviterId, role } = params
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
export async function addStreamPermissionsRevokedActivity(params: {
  streamId: string
  activityUserId: string
  removedUserId: string
}) {
  const { streamId, activityUserId, removedUserId } = params
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
export async function addStreamInviteSentOutActivity(params: {
  streamId: string
  inviteTargetId: string
  inviterId: string
  inviteTargetEmail: string
}) {
  const { streamId, inviteTargetId, inviterId, inviteTargetEmail } = params
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
export async function addStreamInviteDeclinedActivity(params: {
  streamId: string
  inviteTargetId: string
  inviterId: string
}) {
  const { streamId, inviteTargetId, inviterId } = params
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

/**
 * Save "user mentioned in stream comment" activity item
 */
export async function addStreamCommentMentionActivity(params: {
  streamId: string
  mentionAuthorId: string
  mentionTargetId: string
  commentId: string
  threadId: string
}) {
  const { streamId, mentionAuthorId, mentionTargetId, commentId, threadId } = params
  await saveActivity({
    streamId,
    resourceType: ResourceTypes.Comment,
    resourceId: commentId,
    actionType: ActionTypes.Comment.Mention,
    userId: mentionAuthorId,
    message: `User ${mentionAuthorId} mentioned user ${mentionTargetId} in comment ${commentId}`,
    info: {
      mentionAuthorId,
      mentionTargetId,
      commentId,
      threadId
    }
  })
}
