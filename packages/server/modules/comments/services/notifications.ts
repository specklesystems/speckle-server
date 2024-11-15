import { CommentRecord } from '@/modules/comments/helpers/types'
import { CommentsEvents, CommentsEventsListen } from '@/modules/comments/events/emitter'
import { ensureCommentSchema } from '@/modules/comments/services/commentTextService'
import type { JSONContent } from '@tiptap/core'
import { iterateContentNodes } from '@/modules/core/services/richTextEditorService'
import { difference, flatten } from 'lodash'
import {
  NotificationPublisher,
  NotificationType
} from '@/modules/notifications/helpers/types'
import { AddStreamCommentMentionActivity } from '@/modules/activitystream/domain/operations'

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
  (
    deps: { commentsEventsListen: CommentsEventsListen } & SendNotificationsForUsersDeps
  ) =>
  async () => {
    const processCommentMentions = processCommentMentionsFactory(deps)

    const exitCbs = [
      deps.commentsEventsListen(CommentsEvents.Created, async ({ comment }) => {
        await processCommentMentions(comment)
      }),
      deps.commentsEventsListen(
        CommentsEvents.Updated,
        async ({ newComment, previousComment }) => {
          await processCommentMentions(newComment, previousComment)
        }
      )
    ]

    return () => exitCbs.forEach((cb) => cb())
  }
