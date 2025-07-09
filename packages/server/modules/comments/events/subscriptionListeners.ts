import { CommentEvents } from '@/modules/comments/domain/events'
import { GetViewerResourcesForComment } from '@/modules/comments/domain/operations'
import { ProjectCommentsUpdatedMessageType } from '@/modules/core/graph/generated/graphql'
import { DependenciesOf } from '@/modules/shared/helpers/factory'
import { EventBusListen, EventPayload } from '@/modules/shared/services/eventBus'
import {
  CommentSubscriptions,
  ProjectSubscriptions,
  PublishSubscription
} from '@/modules/shared/utils/subscriptions'

const reportCommentCreatedFactory =
  (deps: { publish: PublishSubscription }) =>
  async (payload: EventPayload<typeof CommentEvents.Created>) => {
    const { comment, resourceItems } = payload.payload

    await Promise.all([
      // @deprecated unused in FE2
      deps.publish(CommentSubscriptions.CommentActivity, {
        commentActivity: {
          type: 'comment-added',
          comment
        },
        streamId: comment.streamId,
        resourceIds: resourceItems.map((i) => i.versionId || i.objectId).join(',')
      }),
      deps.publish(ProjectSubscriptions.ProjectCommentsUpdated, {
        projectCommentsUpdated: {
          id: comment.id,
          type: ProjectCommentsUpdatedMessageType.Created,
          comment
        },
        projectId: comment.streamId,
        resourceItems
      })
    ])
  }

const reportCommentArchivedFactory =
  (deps: {
    publish: PublishSubscription
    getViewerResourcesForComment: GetViewerResourcesForComment
  }) =>
  async (payload: EventPayload<typeof CommentEvents.Archived>) => {
    const {
      comment,
      input: { archived, streamId }
    } = payload.payload

    await Promise.all([
      deps.publish(CommentSubscriptions.CommentThreadActivity, {
        commentThreadActivity: {
          type: archived ? 'comment-archived' : 'comment-added'
        },
        streamId,
        commentId: comment.id
      }),
      deps.publish(ProjectSubscriptions.ProjectCommentsUpdated, {
        projectCommentsUpdated: {
          id: comment.id,
          type: archived
            ? ProjectCommentsUpdatedMessageType.Archived
            : ProjectCommentsUpdatedMessageType.Created,
          comment: archived ? null : comment
        },
        projectId: streamId,
        resourceItems: await deps.getViewerResourcesForComment(streamId, comment.id)
      })
    ])
  }

export const reportSubscriptionEventsFactory =
  (
    deps: {
      eventListen: EventBusListen
      publish: PublishSubscription
    } & DependenciesOf<typeof reportCommentCreatedFactory> &
      DependenciesOf<typeof reportCommentArchivedFactory>
  ) =>
  () => {
    const reportCommentCreated = reportCommentCreatedFactory(deps)
    const reportCommentArchived = reportCommentArchivedFactory(deps)

    const quitters = [
      deps.eventListen(CommentEvents.Created, reportCommentCreated),
      deps.eventListen(CommentEvents.Archived, reportCommentArchived)
    ]

    return () => quitters.forEach((q) => q())
  }
