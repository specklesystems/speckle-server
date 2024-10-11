import { ActionTypes, ResourceTypes } from '@/modules/activitystream/helpers/types'
import { StreamRoles } from '@/modules/core/helpers/mainConstants'
import {
  PublishSubscription,
  StreamSubscriptions as StreamPubsubEvents
} from '@/modules/shared/utils/subscriptions'
import { StreamCreateInput } from '@/test/graphql/generated/graphql'
import { Knex } from 'knex'
import { chunk, flatten } from 'lodash'
import { StreamRecord } from '@/modules/core/helpers/types'
import {
  ProjectCreateInput,
  ProjectUpdatedMessageType,
  ProjectUpdateInput,
  StreamUpdateInput,
  UserProjectsUpdatedMessageType
} from '@/modules/core/graph/generated/graphql'
import {
  ProjectSubscriptions,
  UserSubscriptions
} from '@/modules/shared/utils/subscriptions'
import {
  AddStreamCommentMentionActivity,
  AddStreamDeletedActivity,
  AddStreamInviteDeclinedActivity,
  AddStreamInviteSentOutActivity,
  AddStreamUpdatedActivity,
  SaveActivity
} from '@/modules/activitystream/domain/operations'
import { GetStreamCollaborators } from '@/modules/core/domain/streams/operations'

/**
 * Save "stream updated" activity
 */
export const addStreamUpdatedActivityFactory =
  ({
    saveActivity,
    publish
  }: {
    saveActivity: SaveActivity
    publish: PublishSubscription
  }): AddStreamUpdatedActivity =>
  async (params: {
    streamId: string
    updaterId: string
    oldStream: StreamRecord
    newStream: StreamRecord
    update: ProjectUpdateInput | StreamUpdateInput
  }) => {
    const { streamId, updaterId, oldStream, update, newStream } = params

    await Promise.all([
      saveActivity({
        streamId,
        resourceType: ResourceTypes.Stream,
        resourceId: streamId,
        actionType: ActionTypes.Stream.Update,
        userId: updaterId,
        info: { old: oldStream, new: update },
        message: 'Stream metadata changed'
      }),
      publish(StreamPubsubEvents.StreamUpdated, {
        streamUpdated: {
          ...update
        },
        id: streamId
      }),
      publish(ProjectSubscriptions.ProjectUpdated, {
        projectUpdated: {
          id: streamId,
          type: ProjectUpdatedMessageType.Updated,
          project: newStream
        }
      })
    ])
  }

/**
 * Save "stream deleted" activity
 */
export const addStreamDeletedActivityFactory =
  ({
    getStreamCollaborators,
    saveActivity,
    publish
  }: {
    getStreamCollaborators: GetStreamCollaborators
    saveActivity: SaveActivity
    publish: PublishSubscription
  }): AddStreamDeletedActivity =>
  async (params: { streamId: string; deleterId: string }) => {
    const { streamId, deleterId } = params

    // Notify any listeners on streamId
    await Promise.all([
      publish(StreamPubsubEvents.StreamDeleted, {
        streamDeleted: { streamId },
        streamId
      }),
      publish(ProjectSubscriptions.ProjectUpdated, {
        projectUpdated: {
          id: streamId,
          type: ProjectUpdatedMessageType.Deleted,
          project: null
        }
      })
    ])

    // Notify all stream users
    const users = await getStreamCollaborators(streamId)
    const userBatches = chunk(users, 15)
    for (const userBatch of userBatches) {
      await Promise.all(
        flatten(
          userBatch.map((u) => [
            publish(StreamPubsubEvents.UserStreamRemoved, {
              userStreamRemoved: { id: streamId },
              ownerId: u.id
            }),
            publish(UserSubscriptions.UserProjectsUpdated, {
              userProjectsUpdated: {
                id: streamId,
                type: UserProjectsUpdatedMessageType.Removed,
                project: null
              },
              ownerId: u.id
            })
          ])
        )
      )
    }

    await saveActivity({
      streamId,
      resourceType: ResourceTypes.Stream,
      resourceId: streamId,
      actionType: ActionTypes.Stream.Delete,
      userId: deleterId,
      info: {},
      message: `Stream deleted`
    })
  }

/**
 * Save "user cloned stream X" activity item
 */
export const addStreamClonedActivityFactory =
  ({
    saveActivity,
    publish
  }: {
    saveActivity: SaveActivity
    publish: PublishSubscription
  }) =>
  async (
    params: {
      sourceStreamId: string
      newStream: StreamRecord
      clonerId: string
    },
    options?: Partial<{ trx: Knex.Transaction }>
  ) => {
    const { trx } = options || {}
    const { sourceStreamId, newStream, clonerId } = params
    const newStreamId = newStream.id

    const publishSubscriptions = async () =>
      publish(UserSubscriptions.UserProjectsUpdated, {
        userProjectsUpdated: {
          id: newStreamId,
          type: UserProjectsUpdatedMessageType.Added,
          project: newStream
        },
        ownerId: clonerId
      })

    await Promise.all([
      saveActivity({
        streamId: newStreamId,
        resourceType: ResourceTypes.Stream,
        resourceId: newStreamId,
        actionType: ActionTypes.Stream.Clone,
        userId: clonerId,
        info: { sourceStreamId, newStreamId, clonerId },
        message: `User ${clonerId} cloned stream ${sourceStreamId} as ${newStreamId}`
      }),
      !trx ? publishSubscriptions() : null
    ])

    if (trx) {
      // can't await this, cause it'll block everything
      void trx.executionPromise.then(publishSubscriptions)
    }
  }

/**
 * Save "user created stream" activity item
 */
export const addStreamCreatedActivityFactory =
  ({
    saveActivity,
    publish
  }: {
    saveActivity: SaveActivity
    publish: PublishSubscription
  }) =>
  async (params: {
    streamId: string
    creatorId: string
    input: StreamCreateInput | ProjectCreateInput
    stream: StreamRecord
  }) => {
    const { streamId, creatorId, input, stream } = params

    await Promise.all([
      saveActivity({
        streamId,
        resourceType: ResourceTypes.Stream,
        resourceId: streamId,
        actionType: ActionTypes.Stream.Create,
        userId: creatorId,
        info: { input },
        message: `Stream ${input.name} created`
      }),
      publish(StreamPubsubEvents.UserStreamAdded, {
        userStreamAdded: { id: streamId, ...input },
        ownerId: creatorId
      }),
      publish(UserSubscriptions.UserProjectsUpdated, {
        userProjectsUpdated: {
          id: streamId,
          type: UserProjectsUpdatedMessageType.Added,
          project: stream
        },
        ownerId: creatorId
      })
    ])
  }

/**
 * Save "stream permissions granted to user" activity item
 */
export const addStreamPermissionsAddedActivityFactory =
  ({
    saveActivity,
    publish
  }: {
    saveActivity: SaveActivity
    publish: PublishSubscription
  }) =>
  async (params: {
    streamId: string
    activityUserId: string
    targetUserId: string
    role: StreamRoles
    stream: StreamRecord
  }) => {
    const { streamId, activityUserId, targetUserId, role, stream } = params
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
      publish(StreamPubsubEvents.UserStreamAdded, {
        userStreamAdded: {
          id: streamId,
          sharedBy: activityUserId
        },
        ownerId: targetUserId
      }),
      publish(UserSubscriptions.UserProjectsUpdated, {
        userProjectsUpdated: {
          id: streamId,
          type: UserProjectsUpdatedMessageType.Added,
          project: stream
        },
        ownerId: targetUserId
      }),
      publish(ProjectSubscriptions.ProjectUpdated, {
        projectUpdated: {
          id: streamId,
          type: ProjectUpdatedMessageType.Updated,
          project: stream
        }
      })
    ])
  }

/**
 * Save "user accepted stream invite" activity item
 */
export const addStreamInviteAcceptedActivityFactory =
  ({
    saveActivity,
    publish
  }: {
    saveActivity: SaveActivity
    publish: PublishSubscription
  }) =>
  async (params: {
    streamId: string
    inviteTargetId: string
    inviterId: string
    role: StreamRoles
    stream: StreamRecord
  }) => {
    const { streamId, inviteTargetId, inviterId, role, stream } = params
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
      publish(StreamPubsubEvents.UserStreamAdded, {
        userStreamAdded: {
          id: streamId,
          sharedBy: inviterId
        },
        ownerId: inviteTargetId
      }),
      publish(UserSubscriptions.UserProjectsUpdated, {
        userProjectsUpdated: {
          id: streamId,
          type: UserProjectsUpdatedMessageType.Added,
          project: stream
        },
        ownerId: inviteTargetId
      }),
      publish(ProjectSubscriptions.ProjectUpdated, {
        projectUpdated: {
          id: streamId,
          type: ProjectUpdatedMessageType.Updated,
          project: stream
        }
      })
    ])
  }

/**
 * Save "stream permissions revoked for user" activity item
 */
export const addStreamPermissionsRevokedActivityFactory =
  ({
    saveActivity,
    publish
  }: {
    saveActivity: SaveActivity
    publish: PublishSubscription
  }) =>
  async (params: {
    streamId: string
    activityUserId: string
    removedUserId: string
    stream: StreamRecord
  }) => {
    const { streamId, activityUserId, removedUserId, stream } = params
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
      publish(StreamPubsubEvents.UserStreamRemoved, {
        userStreamRemoved: {
          id: streamId,
          revokedBy: activityUserId
        },
        ownerId: removedUserId
      }),
      publish(UserSubscriptions.UserProjectsUpdated, {
        userProjectsUpdated: {
          id: streamId,
          type: UserProjectsUpdatedMessageType.Removed,
          project: null
        },
        ownerId: removedUserId
      }),
      publish(ProjectSubscriptions.ProjectUpdated, {
        projectUpdated: {
          id: streamId,
          type: ProjectUpdatedMessageType.Updated,
          project: stream
        }
      })
    ])
  }

/**
 * Save "user invited another user to stream" activity item
 */
export const addStreamInviteSentOutActivityFactory =
  ({
    saveActivity,
    publish
  }: {
    saveActivity: SaveActivity
    publish: PublishSubscription
  }): AddStreamInviteSentOutActivity =>
  async ({ streamId, inviteTargetId, inviterId, inviteTargetEmail, stream }) => {
    const targetDisplay = inviteTargetId || inviteTargetEmail

    await Promise.all([
      saveActivity({
        streamId,
        resourceType: ResourceTypes.Stream,
        resourceId: streamId,
        actionType: ActionTypes.Stream.InviteSent,
        userId: inviterId,
        message: `User ${inviterId} has invited ${targetDisplay} to stream ${streamId}`,
        info: {
          targetId: inviteTargetId || null,
          targetEmail: inviteTargetEmail || null
        }
      }),
      publish(ProjectSubscriptions.ProjectUpdated, {
        projectUpdated: {
          id: streamId,
          type: ProjectUpdatedMessageType.Updated,
          project: stream
        }
      })
    ])
  }

/**
 * Save "user declined an invite" activity item
 */
export const addStreamInviteDeclinedActivityFactory =
  ({
    saveActivity,
    publish
  }: {
    saveActivity: SaveActivity
    publish: PublishSubscription
  }): AddStreamInviteDeclinedActivity =>
  async ({ streamId, inviteTargetId, inviterId, stream }) => {
    await Promise.all([
      saveActivity({
        streamId,
        resourceType: ResourceTypes.Stream,
        resourceId: streamId,
        actionType: ActionTypes.Stream.InviteDeclined,
        userId: inviteTargetId,
        message: `User ${inviteTargetId} declined to join the stream ${streamId}`,
        info: { targetId: inviteTargetId, inviterId }
      }),
      publish(ProjectSubscriptions.ProjectUpdated, {
        projectUpdated: {
          id: streamId,
          type: ProjectUpdatedMessageType.Updated,
          project: stream
        }
      })
    ])
  }

/**
 * Save "user mentioned in stream comment" activity item
 */
export const addStreamCommentMentionActivityFactory =
  ({ saveActivity }: { saveActivity: SaveActivity }): AddStreamCommentMentionActivity =>
  async ({ streamId, mentionAuthorId, mentionTargetId, commentId, threadId }) => {
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
