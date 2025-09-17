import { db } from '@/db/knex'
import type { GetComment } from '@/modules/comments/domain/operations'
import { getCommentFactory } from '@/modules/comments/repositories/comments'
import type { GetServerInfo } from '@/modules/core/domain/server/operations'
import type { GetStream } from '@/modules/core/domain/streams/operations'
import type { GetUser } from '@/modules/core/domain/users/operations'
import { getCommentRoute } from '@/modules/core/helpers/routeHelper'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { getUserFactory } from '@/modules/core/repositories/users'
import type { EmailTemplateParams } from '@/modules/emails/domain/operations'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { getProjectDbClient } from '@/modules/multiregion/utils/dbSelector'
import type { UserNotificationRecord } from '@/modules/notifications/helpers/types'
import type { NotificationType } from '@/modules/notifications/helpers/types'
import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import type { Knex } from 'knex'
import { validateCommentNotification } from '@/modules/notifications/services/events/handlers/createdOrUpdatedComment'

type MentionedInCommentNotification = Extract<
  UserNotificationRecord,
  { type: NotificationType.MentionedInComment }
>

function buildEmailTemplateMjml(
  state: ReturnType<typeof validateCommentNotification>
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
  state: ReturnType<typeof validateCommentNotification>
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
  state: ReturnType<typeof validateCommentNotification>
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
const mentionedInCommentEmailHandlerFactory =
  (deps: {
    getUser: GetUser
    getStream: GetStream
    getCommentResolver: (deps: { projectDb: Knex }) => GetComment
    getServerInfo: GetServerInfo
    renderEmail: typeof renderEmail
    sendEmail: typeof sendEmail
  }) =>
  async (notification: MentionedInCommentNotification) => {
    const { threadId, commentId, authorId, streamId } = notification.payload

    const isCommentAndThreadTheSame = threadId === commentId
    const projectDb = await getProjectDbClient({ projectId: streamId })
    const getComment = deps.getCommentResolver({ projectDb })

    const [targetUser, author, stream, threadComment, comment, serverInfo] =
      await Promise.all([
        deps.getUser(notification.userId),
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

export const handler = async (notification: MentionedInCommentNotification) => {
  const mentionedInCommentHandler = mentionedInCommentEmailHandlerFactory({
    getUser: getUserFactory({ db }),
    getStream: getStreamFactory({ db }),
    getCommentResolver: ({ projectDb }) => getCommentFactory({ db: projectDb }),
    getServerInfo: getServerInfoFactory({ db }),
    renderEmail,
    sendEmail
  })
  return mentionedInCommentHandler(notification)
}

export default handler
