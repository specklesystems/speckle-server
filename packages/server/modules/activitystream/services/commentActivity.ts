import { db } from '@/db/knex'
import {
  AddCommentCreatedActivity,
  SaveActivity
} from '@/modules/activitystream/domain/operations'
import { CommentCreatedActivityInput } from '@/modules/activitystream/domain/types'
import { ActionTypes, ResourceTypes } from '@/modules/activitystream/helpers/types'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import {
  GetViewerResourceItemsUngrouped,
  GetViewerResourcesFromLegacyIdentifiers
} from '@/modules/comments/domain/operations'
import { ViewerResourceItem } from '@/modules/comments/domain/types'
import { CommentRecord } from '@/modules/comments/helpers/types'
import { getCommentsResourcesFactory } from '@/modules/comments/repositories/comments'
import {
  CommentCreateInput,
  CreateCommentReplyInput,
  ProjectCommentsUpdatedMessageType,
  ReplyCreateInput
} from '@/modules/core/graph/generated/graphql'
import { getCommitsAndTheirBranchIdsFactory } from '@/modules/core/repositories/commits'
import { getStreamObjectsFactory } from '@/modules/core/repositories/objects'
import {
  getViewerResourcesForCommentFactory,
  getViewerResourcesForCommentsFactory,
  getViewerResourcesFromLegacyIdentifiersFactory
} from '@/modules/core/services/commit/viewerResources'
import { PublishSubscription, pubsub } from '@/modules/shared/utils/subscriptions'
import {
  CommentSubscriptions,
  ProjectSubscriptions,
  publish
} from '@/modules/shared/utils/subscriptions'
import { MutationCommentArchiveArgs } from '@/test/graphql/generated/graphql'
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
export async function addCommentArchivedActivity(params: {
  streamId: string
  commentId: string
  userId: string
  input: MutationCommentArchiveArgs
  comment: CommentRecord
}) {
  const { streamId, commentId, userId, input, comment } = params
  const isArchiving = !!input.archived

  const getStreamObjects = getStreamObjectsFactory({ db })
  const getCommentsResources = getCommentsResourcesFactory({ db })
  const getViewerResourcesFromLegacyIdentifiers =
    getViewerResourcesFromLegacyIdentifiersFactory({
      getViewerResourcesForComments: getViewerResourcesForCommentsFactory({
        getCommentsResources: getCommentsResourcesFactory({ db }),
        getViewerResourcesFromLegacyIdentifiers: (...args) =>
          getViewerResourcesFromLegacyIdentifiers(...args) // recursive dep
      }),
      getCommitsAndTheirBranchIds: getCommitsAndTheirBranchIdsFactory({ db }),
      getStreamObjects
    })

  const getViewerResourcesForComment = getViewerResourcesForCommentFactory({
    getCommentsResources,
    getViewerResourcesFromLegacyIdentifiers
  })

  await Promise.all([
    saveActivityFactory({ db })({
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

  const getStreamObjects = getStreamObjectsFactory({ db })
  const getCommentsResources = getCommentsResourcesFactory({ db })
  const getViewerResourcesFromLegacyIdentifiers =
    getViewerResourcesFromLegacyIdentifiersFactory({
      getViewerResourcesForComments: getViewerResourcesForCommentsFactory({
        getCommentsResources: getCommentsResourcesFactory({ db }),
        getViewerResourcesFromLegacyIdentifiers: (...args) =>
          getViewerResourcesFromLegacyIdentifiers(...args) // recursive dep
      }),
      getCommitsAndTheirBranchIds: getCommitsAndTheirBranchIdsFactory({ db }),
      getStreamObjects
    })

  const getViewerResourcesForComment = getViewerResourcesForCommentFactory({
    getCommentsResources,
    getViewerResourcesFromLegacyIdentifiers
  })

  const parentCommentId = isLegacyReplyCreateInput(input)
    ? input.parentComment
    : input.threadId
  await Promise.all([
    saveActivityFactory({ db })({
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
