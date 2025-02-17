import { ActionTypes, ResourceTypes } from '@/modules/activitystream/helpers/types'
import { StreamRoles } from '@/modules/core/helpers/mainConstants'
import {
  PublishSubscription,
  StreamSubscriptions as StreamPubsubEvents,
  WorkspaceSubscriptions
} from '@/modules/shared/utils/subscriptions'
import { Knex } from 'knex'
import { chunk, flatten } from 'lodash'
import { StreamRecord } from '@/modules/core/helpers/types'
import {
  ProjectCreateInput,
  ProjectUpdatedMessageType,
  ProjectUpdateInput,
  StreamCreateInput,
  StreamUpdateInput,
  UserProjectsUpdatedMessageType,
  WorkspaceProjectsUpdatedMessageType
} from '@/modules/core/graph/generated/graphql'
import {
  ProjectSubscriptions,
  UserSubscriptions
} from '@/modules/shared/utils/subscriptions'
import {
  AddStreamCommentMentionActivity,
  AddStreamDeletedActivity,
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
  async (params) => {
    const { streamId, deleterId, workspaceId } = params

    // Notify any listeners on streamId/workspaceId
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
      }),
      ...(workspaceId
        ? [
            publish(WorkspaceSubscriptions.WorkspaceProjectsUpdated, {
              workspaceProjectsUpdated: {
                projectId: streamId,
                type: WorkspaceProjectsUpdatedMessageType.Removed,
                project: null,
                workspaceId
              },
              workspaceId
            })
          ]
        : [])
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
      await Promise.all([
        publish(UserSubscriptions.UserProjectsUpdated, {
          userProjectsUpdated: {
            id: newStreamId,
            type: UserProjectsUpdatedMessageType.Added,
            project: newStream
          },
          ownerId: clonerId
        }),
        ...(newStream.workspaceId
          ? [
              publish(WorkspaceSubscriptions.WorkspaceProjectsUpdated, {
                workspaceProjectsUpdated: {
                  projectId: newStreamId,
                  type: WorkspaceProjectsUpdatedMessageType.Added,
                  project: newStream,
                  workspaceId: newStream.workspaceId
                },
                workspaceId: newStream.workspaceId
              })
            ]
          : [])
      ])

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
      }),
      ...(stream.workspaceId
        ? [
            publish(WorkspaceSubscriptions.WorkspaceProjectsUpdated, {
              workspaceProjectsUpdated: {
                projectId: streamId,
                type: WorkspaceProjectsUpdatedMessageType.Added,
                project: stream,
                workspaceId: stream.workspaceId
              },
              workspaceId: stream.workspaceId
            })
          ]
        : [])
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
