import type { CommentRecord } from '@/modules/comments/helpers/types'
import { ensureCommentSchema } from '@/modules/comments/services/commentTextService'
import { flatten } from 'lodash-es'
import type { NotificationPublisher } from '@/modules/notifications/helpers/types'
import { NotificationType } from '@speckle/shared/notifications'
import type {
  AddStreamCommentMentionActivity,
  SaveStreamActivity
} from '@/modules/activitystream/domain/operations'
import type { EventBus } from '@/modules/shared/services/eventBus'
import { CommentEvents } from '@/modules/comments/domain/events'
import {
  StreamActionTypes,
  StreamResourceTypes
} from '@/modules/activitystream/helpers/types'
import { processCommentMentions } from '@/modules/notifications/services/events/handlers/createdOrUpdatedComment'

/**
 * Save "user mentioned in stream comment" activity item
 */
const addStreamCommentMentionActivityFactory =
  ({
    saveActivity
  }: {
    saveActivity: SaveStreamActivity
  }): AddStreamCommentMentionActivity =>
  async ({ streamId, mentionAuthorId, mentionTargetId, commentId, threadId }) => {
    await saveActivity({
      streamId,
      resourceType: StreamResourceTypes.Comment,
      resourceId: commentId,
      actionType: StreamActionTypes.Comment.Mention,
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

type SendNotificationsForUsersDeps = {
  publish: NotificationPublisher
  addStreamCommentMentionActivity: AddStreamCommentMentionActivity
}

const sendNotificationsForUsersFactory =
  (deps: SendNotificationsForUsersDeps) =>
  async (userIds: string[], comment: CommentRecord) => {
    const { id, streamId, authorId, parentComment } = comment
    const threadId = parentComment || id

    await Promise.all(
      flatten(
        userIds.map((uid) => {
          return [
            // Actually send out notification
            deps.publish(NotificationType.MentionedInComment, {
              targetUserId: uid,
              data: {
                threadId,
                streamId,
                authorId,
                commentId: id
              }
            }),
            // Create activity item
            deps.addStreamCommentMentionActivity({
              streamId,
              mentionAuthorId: authorId,
              mentionTargetId: uid,
              commentId: id,
              threadId
            })
          ]
        })
      )
    )
  }

/**
 * Hook into the comments lifecycle to generate notifications accordingly
 * @returns Callback to invoke when you wish to stop listening for comments events
 */
export const notifyUsersOnCommentEventsFactory =
  (deps: {
    eventBus: EventBus
    publish: NotificationPublisher
    saveActivity: SaveStreamActivity
  }) =>
  async () => {
    const addStreamCommentMentionActivity = addStreamCommentMentionActivityFactory(deps)
    const sendNotificationsForUsers = sendNotificationsForUsersFactory({
      ...deps,
      addStreamCommentMentionActivity
    })

    const exitCbs = [
      deps.eventBus.listen(CommentEvents.Created, async ({ payload: { comment } }) => {
        const newMentions = processCommentMentions(comment)
        if (newMentions.length) await sendNotificationsForUsers(newMentions, comment)
      }),
      deps.eventBus.listen(
        CommentEvents.Updated,
        async ({ payload: { newComment, previousComment } }) => {
          const newMentions = processCommentMentions(newComment, previousComment)
          if (newMentions.length)
            await sendNotificationsForUsers(newMentions, newComment)
        }
      )
    ]

    return () => exitCbs.forEach((cb) => cb())
  }
