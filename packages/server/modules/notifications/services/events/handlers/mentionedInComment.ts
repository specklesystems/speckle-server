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
import { getCommentRoute } from '@/modules/core/helpers/routeHelper'
import type { ServerInfo } from '@/modules/core/helpers/types'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import type { UserWithOptionalRole } from '@/modules/core/repositories/users'
import { getUserFactory } from '@/modules/core/repositories/users'
import { iterateContentNodes } from '@/modules/core/services/richTextEditorService'
import type { EmailTemplateParams } from '@/modules/emails/domain/operations'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import type { SaveUserNotifications } from '@/modules/notifications/domain/operations'
import { NotificationValidationError } from '@/modules/notifications/errors'
import { NotificationType } from '@/modules/notifications/helpers/types'
import { saveUserNotificationsFactory } from '@/modules/notifications/repositories/userNotification'
import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import type { MaybeFalsy, Nullable } from '@/modules/shared/helpers/typeHelper'
import type { EventBusPayloads } from '@/modules/shared/services/eventBus'
import type { JSONContent } from '@tiptap/core'
import cryptoRandomString from 'crypto-random-string'
import type { Knex } from 'knex'
import { difference } from 'lodash-es'

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

function validate(state: {
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

function buildEmailTemplateMjml(
  state: ValidatedNotificationState
): EmailTemplateParams['mjml'] {
  const { author, stream } = state

  return {
    bodyStart: `
  <mj-text align="center" line-height="2" >
  Hello,<br/>
  <br/>
  <b>${author.name}</b> has just mentioned you in a comment on the <b>${stream.name}</b> project.
  Please click on the button below to see the comment.
  </mj-text>
  `,
    bodyEnd: `<br/><br/>`
  }
}

function buildEmailTemplateText(
  state: ValidatedNotificationState
): EmailTemplateParams['text'] {
  const { author, stream } = state

  return {
    bodyStart: `Hello

${author.name} has just mentioned you in a comment on the ${stream.name} project.
Please open the link below to see the comment.`,
    bodyEnd: undefined
  }
}

function buildEmailTemplateParams(
  state: ValidatedNotificationState
): EmailTemplateParams {
  const {
    commitOrObjectId: { objectId, commitId },
    stream,
    threadComment
  } = state

  const commentRoute = getCommentRoute(stream.id, threadComment.id, {
    objectId,
    commitId
  })
  const url = new URL(commentRoute, getFrontendOrigin()).toString()

  return {
    mjml: buildEmailTemplateMjml(state),
    text: buildEmailTemplateText(state),
    cta: {
      url,
      title: 'View comment thread'
    }
  }
}

/**
 * Notification that is triggered when a user is mentioned in a comment
 */
const mentionedInCommentHandlerFactory =
  (deps: {
    getUser: GetUser
    getStream: GetStream
    getCommentResolver: (deps: { projectDb: Knex }) => GetComment
    getServerInfo: GetServerInfo
    renderEmail: typeof renderEmail
    sendEmail: typeof sendEmail
    saveUserNotifications: SaveUserNotifications
  }) =>
  async ({
    payload
  }: {
    payload: EventBusPayloads['comments.created'] | EventBusPayloads['comments.updated']
  }) => {
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
      const state = validate({
        targetUser,
        author,
        stream,
        threadComment,
        mentionComment,
        serverInfo
      })

      const now = new Date()
      await deps.saveUserNotifications([
        {
          id: cryptoRandomString({ length: 10 }),
          userId: state.targetUser.id,
          notificationType: NotificationType.MentionedInComment,
          read: false,
          payload: {
            threadId: state.threadComment.id,
            commentId: state.mentionComment.id,
            commitId: state.commitOrObjectId.commitId,
            objectId: state.commitOrObjectId.objectId,
            streamId: state.stream.id
          },
          sendEmailAt: null,
          createdAt: now,
          updatedAt: now
        }
      ])

      const templateParams = buildEmailTemplateParams(state)
      const { text, html } = await deps.renderEmail(
        templateParams,
        serverInfo,
        targetUser
      )
      await deps.sendEmail({
        to: state.targetUser.email,
        text,
        html,
        subject: "You've just been mentioned in a Speckle comment"
      })
    }
  }

/**
 * Notification that is triggered when a user is mentioned in a comment
 */
export const handler = async (args: {
  payload: EventBusPayloads['comments.created'] | EventBusPayloads['comments.updated'] // TODO: smarter typing
}) => {
  const mentionedInCommentHandler = mentionedInCommentHandlerFactory({
    getUser: getUserFactory({ db }),
    getStream: getStreamFactory({ db }),
    getCommentResolver: ({ projectDb }) => getCommentFactory({ db: projectDb }),
    getServerInfo: getServerInfoFactory({ db }),
    renderEmail,
    sendEmail,
    saveUserNotifications: saveUserNotificationsFactory({ db })
  })
  return mentionedInCommentHandler(args)
}

export default handler
