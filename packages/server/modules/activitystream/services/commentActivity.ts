import { ActionTypes, ResourceTypes } from '@/modules/activitystream/helpers/types'
import { saveActivity } from '@/modules/activitystream/services'
import { CommentRecord } from '@/modules/comments/helpers/types'
import {
  CommentCreateInput,
  CreateCommentInput,
  CreateCommentReplyInput,
  ProjectCommentsUpdatedMessageType,
  ReplyCreateInput,
  ViewerResourceItem
} from '@/modules/core/graph/generated/graphql'
import {
  getViewerResourceItemsUngrouped,
  getViewerResourcesForComment,
  getViewerResourcesFromLegacyIdentifiers
} from '@/modules/core/services/commit/viewerResources'
import { pubsub } from '@/modules/shared/utils/subscriptions'
import {
  CommentSubscriptions,
  ProjectSubscriptions,
  publish
} from '@/modules/shared/utils/subscriptions'
import { MutationCommentArchiveArgs } from '@/test/graphql/generated/graphql'
import { has } from 'lodash'

type CommentCreatedActivityInput =
  | CommentCreateInput
  | (CreateCommentInput & { resolvedResourceItems?: ViewerResourceItem[] })

const isLegacyCommentCreateInput = (
  i: CommentCreatedActivityInput
): i is CommentCreateInput => has(i, 'streamId')

export async function addCommentCreatedActivity(params: {
  streamId: string
  userId: string
  input: CommentCreatedActivityInput
  comment: CommentRecord
}) {
  const { streamId, userId, input, comment } = params

  let resourceIds: string
  let resourceItems: ViewerResourceItem[]
  if (isLegacyCommentCreateInput(input)) {
    resourceIds = input.resources.map((res) => res?.resourceId).join(',')

    const validResources = input.resources.filter(
      (r): r is NonNullable<typeof r> => !!r
    )
    resourceItems = await getViewerResourcesFromLegacyIdentifiers(
      streamId,
      validResources
    )
  } else {
    resourceItems =
      input.resolvedResourceItems ||
      (await getViewerResourceItemsUngrouped({
        projectId: streamId,
        resourceIdString: input.resourceIdString
      }))
    resourceIds = resourceItems.map((i) => i.versionId || i.objectId).join(',')
  }

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
      resourceIds
    }),
    publish(ProjectSubscriptions.ProjectCommentsUpdated, {
      projectCommentsUpdated: {
        id: comment.id,
        type: ProjectCommentsUpdatedMessageType.Created,
        comment
      },
      projectId: streamId,
      resourceItems
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

type ReplyCreatedActivityInput = ReplyCreateInput | CreateCommentReplyInput

const isLegacyReplyCreateInput = (
  i: ReplyCreatedActivityInput
): i is ReplyCreateInput => has(i, 'streamId')

export async function addReplyAddedActivity(params: {
  streamId: string
  input: ReplyCreatedActivityInput
  reply: CommentRecord
  userId: string
}) {
  const { streamId, input, reply, userId } = params

  const parentCommentId = isLegacyReplyCreateInput(input)
    ? input.parentComment
    : input.threadId
  await Promise.all([
    saveActivity({
      streamId,
      resourceType: ResourceTypes.Comment,
      resourceId: parentCommentId,
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
      streamId,
      commentId: parentCommentId
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
