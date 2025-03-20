import { CommentRecord } from '@/modules/comments/helpers/types'
import { ensureCommentSchema } from '@/modules/comments/services/commentTextService'
import type { JSONContent } from '@tiptap/core'
import { iterateContentNodes } from '@/modules/core/services/richTextEditorService'
import { difference, flatten } from 'lodash'
import {
  NotificationPublisher,
  NotificationType
} from '@/modules/notifications/helpers/types'
import {
  AddStreamCommentMentionActivity,
  SaveActivity
} from '@/modules/activitystream/domain/operations'
import { EventBus } from '@/modules/shared/services/eventBus'
import { CommentEvents } from '@/modules/comments/domain/events'
import { ActionTypes, ResourceTypes } from '@/modules/activitystream/helpers/types'

function findMentionedUserIds(doc: JSONContent) {
  const mentionedUserIds = new Set<string>()

  for (const node of iterateContentNodes(doc)) {
    if (node.type === 'mention') {
      const uid = node.attrs?.id
      if (uid) {
        mentionedUserIds.add(uid)
      }
    }
  }

  return [...mentionedUserIds]
}

function collectMentionedUserIds(comment: CommentRecord): string[] {
  if (!comment.text) return []

  const { doc } = ensureCommentSchema(comment.text)
  if (!doc) return []

  return findMentionedUserIds(doc)
}

/**
 * Save "user mentioned in stream comment" activity item
 */
const addStreamCommentMentionActivityFactory =
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

const processCommentMentionsFactory =
  (deps: SendNotificationsForUsersDeps) =>
  async (newComment: CommentRecord, previousComment?: CommentRecord) => {
    const newMentionedUserIds = collectMentionedUserIds(newComment)
    const previouslyMentionedUserIds = previousComment
      ? collectMentionedUserIds(previousComment)
      : []

    const newMentions = difference(newMentionedUserIds, previouslyMentionedUserIds)
    if (!newMentions.length) return

    await sendNotificationsForUsersFactory(deps)(newMentions, newComment)
  }

/**
 * Hook into the comments lifecycle to generate notifications accordingly
 * @returns Callback to invoke when you wish to stop listening for comments events
 */
export const notifyUsersOnCommentEventsFactory =
  (deps: {
    eventBus: EventBus
    publish: NotificationPublisher
    saveActivity: SaveActivity
  }) =>
  async () => {
    const addStreamCommentMentionActivity = addStreamCommentMentionActivityFactory(deps)
    const processCommentMentions = processCommentMentionsFactory({
      ...deps,
      addStreamCommentMentionActivity
    })

    const exitCbs = [
      deps.eventBus.listen(CommentEvents.Created, async ({ payload: { comment } }) => {
        await processCommentMentions(comment)
      }),
      deps.eventBus.listen(
        CommentEvents.Updated,
        async ({ payload: { newComment, previousComment } }) => {
          await processCommentMentions(newComment, previousComment)
        }
      )
    ]

    return () => exitCbs.forEach((cb) => cb())
  }
