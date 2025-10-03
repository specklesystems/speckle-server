import { db } from '@/db/knex'
import type { GetComment } from '@/modules/comments/domain/operations'
import type { ExtendedComment } from '@/modules/comments/domain/types'
import type { CommentRecord } from '@/modules/comments/helpers/types'
import { getCommentFactory } from '@/modules/comments/repositories/comments'
import { ensureCommentSchema } from '@/modules/comments/services/commentTextService'
import type { GetServerInfo } from '@/modules/core/domain/server/operations'
import type { GetStream } from '@/modules/core/domain/streams/operations'
import type { StreamWithOptionalRole } from '@/modules/core/domain/streams/types'
import type { GetUser } from '@/modules/core/domain/users/operations'
import { Roles } from '@/modules/core/helpers/mainConstants'
import type { ServerInfo } from '@/modules/core/helpers/types'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import type { UserWithOptionalRole } from '@/modules/core/repositories/users'
import { getUserFactory } from '@/modules/core/repositories/users'
import { iterateContentNodes } from '@/modules/core/services/richTextEditorService'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import type {
  GetUserPreferenceForNotificationType,
  StoreUserNotifications
} from '@/modules/notifications/domain/operations'
import { NotificationValidationError } from '@/modules/notifications/errors'
import { NotificationChannel } from '@/modules/notifications/helpers/types'
import { storeUserNotificationsFactory } from '@/modules/notifications/repositories/userNotification'
import type { MaybeFalsy, Nullable } from '@/modules/shared/helpers/typeHelper'
import type { EventType } from '@/modules/shared/services/eventBus'
import type { JSONContent } from '@tiptap/core'
import cryptoRandomString from 'crypto-random-string'
import type { Knex } from 'knex'
import { difference } from 'lodash-es'
import { getUserPreferenceForNotificationTypeFactory } from '@/modules/notifications/services/notificationPreferences'
import { getSavedUserNotificationPreferencesFactory } from '@/modules/notifications/repositories/userNotificationPreferences'
import { NotificationType } from '@speckle/shared/notifications'

type ValidatedNotificationState = {
  targetUser: UserWithOptionalRole
  author: UserWithOptionalRole
  stream: StreamWithOptionalRole
  threadComment: ExtendedComment
  mentionComment: ExtendedComment
  commitOrObjectId: { commitId: Nullable<string>; objectId: Nullable<string> }
  serverInfo: ServerInfo
}

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

export const processCommentMentions = (
  newComment: CommentRecord,
  previousComment?: CommentRecord
) => {
  const newMentionedUserIds = collectMentionedUserIds(newComment)
  const previouslyMentionedUserIds = previousComment
    ? collectMentionedUserIds(previousComment)
    : []

  return difference(newMentionedUserIds, previouslyMentionedUserIds)
}

export function validateCommentNotification(state: {
  targetUser: MaybeFalsy<UserWithOptionalRole>
  author: MaybeFalsy<UserWithOptionalRole>
  stream: MaybeFalsy<StreamWithOptionalRole>
  threadComment: MaybeFalsy<ExtendedComment>
  mentionComment: MaybeFalsy<ExtendedComment>
  serverInfo: ServerInfo
}): ValidatedNotificationState {
  const { targetUser, author, stream, threadComment, mentionComment, serverInfo } =
    state

  if (
    !targetUser ||
    targetUser.role === Roles.Server.ArchivedUser ||
    !targetUser.email
  ) {
    throw new NotificationValidationError('Invalid mention target user')
  }

  if (!author || author.role === Roles.Server.ArchivedUser) {
    throw new NotificationValidationError('Invalid mention author user')
  }

  if (!stream) {
    throw new NotificationValidationError('Invalid mention stream')
  }

  if (!threadComment || threadComment.streamId !== stream.id) {
    throw new NotificationValidationError('Invalid mention thread comment')
  }

  if (!mentionComment || mentionComment.streamId !== stream.id) {
    throw new NotificationValidationError('Invalid mention comment')
  }

  const commitOrObjectResource = threadComment.resources.find((r) =>
    ['commit', 'object'].includes(r.resourceType)
  )
  if (!commitOrObjectResource) {
    // This will only happen if threadComment is actually a reply, so if the notification
    // was emitted with wrong parameters
    throw new NotificationValidationError(
      "Couldn't resolve the comment's associated resource - the comment might be a reply"
    )
  }

  const commitId =
    commitOrObjectResource.resourceType === 'commit'
      ? commitOrObjectResource.resourceId
      : null
  const objectId =
    commitOrObjectResource.resourceType === 'object'
      ? commitOrObjectResource.resourceId
      : null

  return {
    targetUser,
    author,
    stream,
    threadComment,
    mentionComment,
    commitOrObjectId: { commitId, objectId },
    serverInfo
  }
}

/**
 * Notification that is triggered when a user is mentioned in a comment
 */
const createdOrUpdatedCommentHandlerFactory =
  (deps: {
    getUser: GetUser
    getStream: GetStream
    getCommentResolver: (deps: { projectDb: Knex }) => GetComment
    getServerInfo: GetServerInfo
    saveUserNotifications: StoreUserNotifications
    getUserPreferenceForNotificationType: GetUserPreferenceForNotificationType
  }) =>
  async ({ payload }: EventType<'comments.created' | 'comments.updated'>) => {
    const mentionedUserIds =
      'comment' in payload
        ? processCommentMentions(payload.comment)
        : processCommentMentions(payload.newComment, payload.previousComment)

    for (const targetUserId of mentionedUserIds) {
      const {
        authorId,
        streamId,
        id: commentId,
        parentComment
      } = 'comment' in payload ? payload.comment : payload.newComment

      // do not notify yourself
      if (authorId === targetUserId) continue

      const threadId = parentComment || commentId
      const isCommentAndThreadTheSame = threadId === commentId
      const projectDb = await getProjectDbClient({ projectId: streamId })
      const getComment = deps.getCommentResolver({ projectDb })

      const [targetUser, author, stream, threadComment, comment, serverInfo] =
        await Promise.all([
          deps.getUser(targetUserId),
          deps.getUser(authorId),
          deps.getStream({ streamId }),
          getComment({ id: threadId }),
          isCommentAndThreadTheSame ? null : getComment({ id: commentId }),
          deps.getServerInfo()
        ])

      const mentionComment = isCommentAndThreadTheSame ? threadComment : comment

      // Validate message
      const state = validateCommentNotification({
        targetUser,
        author,
        stream,
        threadComment,
        mentionComment,
        serverInfo
      })

      const isSubscribedToEmail = await deps.getUserPreferenceForNotificationType(
        state.targetUser.id,
        NotificationType.MentionedInComment,
        NotificationChannel.Email
      )

      const now = new Date()
      await deps.saveUserNotifications([
        {
          id: cryptoRandomString({ length: 10 }),
          userId: state.targetUser.id,
          type: NotificationType.MentionedInComment,
          read: false,
          version: '1',
          payload: {
            threadId: state.threadComment.id,
            authorId: state.author.id,
            commentId: state.mentionComment.id,
            streamId: state.stream.id
          },
          sendEmailAt: isSubscribedToEmail ? now : null,
          createdAt: now,
          updatedAt: now
        }
      ])
    }
  }

export const handler = async (
  event: EventType<'comments.created' | 'comments.updated'>
) => {
  const createdOrUpdatedCommentHandler = createdOrUpdatedCommentHandlerFactory({
    getUser: getUserFactory({ db }),
    getStream: getStreamFactory({ db }),
    getCommentResolver: ({ projectDb }) => getCommentFactory({ db: projectDb }),
    getServerInfo: getServerInfoFactory({ db }),
    saveUserNotifications: storeUserNotificationsFactory({ db }),
    getUserPreferenceForNotificationType: getUserPreferenceForNotificationTypeFactory({
      getSavedUserNotificationPreferences: getSavedUserNotificationPreferencesFactory({
        db
      })
    })
  })

  return createdOrUpdatedCommentHandler(event)
}

export default handler
