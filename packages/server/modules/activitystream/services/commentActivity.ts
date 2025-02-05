import {
  AddCommentArchivedActivity,
  AddCommentCreatedActivity,
  AddReplyAddedActivity,
  SaveActivity
} from '@/modules/activitystream/domain/operations'
import {
  CommentCreatedActivityInput,
  ReplyCreatedActivityInput
} from '@/modules/activitystream/domain/types'
import { ActionTypes, ResourceTypes } from '@/modules/activitystream/helpers/types'
import {
  GetViewerResourceItemsUngrouped,
  GetViewerResourcesForComment,
  GetViewerResourcesFromLegacyIdentifiers
} from '@/modules/comments/domain/operations'
import { ViewerResourceItem } from '@/modules/comments/domain/types'
import {
  CommentCreateInput,
  ProjectCommentsUpdatedMessageType,
  ReplyCreateInput
} from '@/modules/core/graph/generated/graphql'
import { PublishSubscription, pubsub } from '@/modules/shared/utils/subscriptions'
import {
  CommentSubscriptions,
  ProjectSubscriptions
} from '@/modules/shared/utils/subscriptions'
import { has } from 'lodash'

const isLegacyCommentCreateInput = (
  i: CommentCreatedActivityInput
): i is CommentCreateInput => has(i, 'streamId')

export const addCommentCreatedActivityFactory =
  ({
    getViewerResourceItemsUngrouped,
    getViewerResourcesFromLegacyIdentifiers,
    saveActivity,
    publish
  }: {
    getViewerResourceItemsUngrouped: GetViewerResourceItemsUngrouped
    getViewerResourcesFromLegacyIdentifiers: GetViewerResourcesFromLegacyIdentifiers
    saveActivity: SaveActivity
    publish: PublishSubscription
  }): AddCommentCreatedActivity =>
  async (params) => {
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
      // @deprecated unused in FE2
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
export const addCommentArchivedActivityFactory =
  ({
    getViewerResourcesForComment,
    saveActivity,
    publish
  }: {
    getViewerResourcesForComment: GetViewerResourcesForComment
    publish: PublishSubscription
    saveActivity: SaveActivity
  }): AddCommentArchivedActivity =>
  async (params) => {
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
      // @deprecated not used in FE2
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

const isLegacyReplyCreateInput = (
  i: ReplyCreatedActivityInput
): i is ReplyCreateInput => has(i, 'streamId')

export const addReplyAddedActivityFactory =
  ({
    getViewerResourcesForComment,
    saveActivity,
    publish
  }: {
    getViewerResourcesForComment: GetViewerResourcesForComment
    publish: PublishSubscription
    saveActivity: SaveActivity
  }): AddReplyAddedActivity =>
  async (params) => {
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
      // @deprecated
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
