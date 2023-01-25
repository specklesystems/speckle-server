import { ActionTypes, ResourceTypes } from '@/modules/activitystream/helpers/types'
import { saveActivity } from '@/modules/activitystream/services'
import { CommentRecord } from '@/modules/comments/helpers/types'
import {
  CommentCreateInput,
  ProjectCommentsUpdatedMessageType,
  ReplyCreateInput
} from '@/modules/core/graph/generated/graphql'
import {
  getViewerResourcesForComment,
  getViewerResourcesFromLegacyIdentifiers
} from '@/modules/core/services/commit/viewerResources'
import { pubsub } from '@/modules/shared'
import {
  CommentSubscriptions,
  ProjectSubscriptions,
  publish
} from '@/modules/shared/utils/subscriptions'
import { MutationCommentArchiveArgs } from '@/test/graphql/generated/graphql'

export async function addCommentCreatedActivity(params: {
  streamId: string
  userId: string
  input: CommentCreateInput
  comment: CommentRecord
}) {
  const { streamId, userId, input, comment } = params

  const validResources = input.resources.filter((r): r is NonNullable<typeof r> => !!r)
  await Promise.all([
    saveActivity({
      resourceId: comment.id,
      streamId,
      resourceType: ResourceTypes.Comment,
      actionType: ActionTypes.Comment.Create,
      userId,
      info: { input },
      message: `Comment added: ${comment.id} (${input})`
    }),
    pubsub.publish(CommentSubscriptions.CommentActivity, {
      commentActivity: {
        type: 'comment-added',
        comment
      },
      streamId,
      resourceIds: input.resources.map((res) => res?.resourceId).join(',')
    }),
    publish(ProjectSubscriptions.ProjectCommentsUpdated, {
      projectCommentsUpdated: {
        id: comment.id,
        type: ProjectCommentsUpdatedMessageType.Created,
        comment
      },
      projectId: streamId,
      resourceItems: validResources
        ? await getViewerResourcesFromLegacyIdentifiers(streamId, validResources)
        : []
    })
  ])
}

/**
 * Add comment archived/unarchived activity
 */
export async function addCommentArchivedActivity(params: {
  streamId: string
  commentId: string
  userId: string
  input: MutationCommentArchiveArgs
  comment: CommentRecord
}) {
  const { streamId, commentId, userId, input, comment } = params
  const isArchiving = !!input.archived

  await Promise.all([
    saveActivity({
      streamId,
      resourceType: ResourceTypes.Comment,
      resourceId: commentId,
      actionType: ActionTypes.Comment.Archive,
      userId,
      info: { input },
      message: `Comment #${commentId} archived`
    }),
    pubsub.publish(CommentSubscriptions.CommentThreadActivity, {
      commentThreadActivity: {
        type: isArchiving ? 'comment-archived' : 'comment-added'
      },
      streamId: input.streamId,
      commentId: input.commentId
    }),
    publish(ProjectSubscriptions.ProjectCommentsUpdated, {
      projectCommentsUpdated: {
        id: commentId,
        type: isArchiving
          ? ProjectCommentsUpdatedMessageType.Archived
          : ProjectCommentsUpdatedMessageType.Created,
        comment: isArchiving ? null : comment
      },
      projectId: streamId,
      resourceItems: await getViewerResourcesForComment(streamId, comment.id)
    })
  ])
}

export async function addReplyAddedActivity(params: {
  streamId: string
  input: ReplyCreateInput
  reply: CommentRecord
  userId: string
}) {
  const { streamId, input, reply, userId } = params

  await Promise.all([
    saveActivity({
      streamId,
      resourceType: ResourceTypes.Comment,
      resourceId: input.parentComment,
      actionType: ActionTypes.Comment.Reply,
      userId,
      info: { input },
      message: `Comment reply #${reply.id} created`
    }),
    pubsub.publish(CommentSubscriptions.CommentThreadActivity, {
      commentThreadActivity: {
        type: 'reply-added',
        reply
      },
      streamId: input.streamId,
      commentId: input.parentComment
    }),
    publish(ProjectSubscriptions.ProjectCommentsUpdated, {
      projectCommentsUpdated: {
        id: reply.id,
        type: ProjectCommentsUpdatedMessageType.Created,
        comment: reply
      },
      projectId: streamId,
      resourceItems: await getViewerResourcesForComment(streamId, reply.id)
    })
  ])
}
