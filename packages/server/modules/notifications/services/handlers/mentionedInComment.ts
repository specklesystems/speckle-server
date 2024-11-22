import { db } from '@/db/knex'
import { GetComment } from '@/modules/comments/domain/operations'
import { ExtendedComment } from '@/modules/comments/domain/types'
import { getCommentFactory } from '@/modules/comments/repositories/comments'
import { GetServerInfo } from '@/modules/core/domain/server/operations'
import { GetStream } from '@/modules/core/domain/streams/operations'
import { StreamWithOptionalRole } from '@/modules/core/domain/streams/types'
import { GetUser } from '@/modules/core/domain/users/operations'
import { Roles } from '@/modules/core/helpers/mainConstants'
import { getCommentRoute } from '@/modules/core/helpers/routeHelper'
import { ServerInfo } from '@/modules/core/helpers/types'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { getUserFactory, UserWithOptionalRole } from '@/modules/core/repositories/users'
import {
  EmailTemplateParams,
  renderEmail
} from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { getProjectDbClient } from '@/modules/multiregion/dbSelector'
import { NotificationValidationError } from '@/modules/notifications/errors'
import {
  NotificationHandler,
  MentionedInCommentMessage
} from '@/modules/notifications/helpers/types'
import { getBaseUrl } from '@/modules/shared/helpers/envHelper'
import { MaybeFalsy, Nullable } from '@/modules/shared/helpers/typeHelper'
import { Knex } from 'knex'

type ValidatedNotificationState = {
  msg: MentionedInCommentMessage
  targetUser: UserWithOptionalRole
  author: UserWithOptionalRole
  stream: StreamWithOptionalRole
  threadComment: ExtendedComment
  mentionComment: ExtendedComment
  commitOrObjectId: { commitId: Nullable<string>; objectId: Nullable<string> }
  serverInfo: ServerInfo
}

function validate(state: {
  msg: MentionedInCommentMessage
  targetUser: MaybeFalsy<UserWithOptionalRole>
  author: MaybeFalsy<UserWithOptionalRole>
  stream: MaybeFalsy<StreamWithOptionalRole>
  threadComment: MaybeFalsy<ExtendedComment>
  mentionComment: MaybeFalsy<ExtendedComment>
  serverInfo: ServerInfo
}): ValidatedNotificationState {
  const { targetUser, author, stream, threadComment, mentionComment, msg, serverInfo } =
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
    msg,
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
  <mj-text>
  Hello,<br/>
  <br/>
  <b>${author.name}</b> has just mentioned you in a comment on the <b>${stream.name}</b> project.
  Please click on the button below to see the comment. 
  </mj-text>
  `,
    bodyEnd: undefined
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
  const url = new URL(commentRoute, getBaseUrl()).toString()

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
  }): NotificationHandler<MentionedInCommentMessage> =>
  async (msg) => {
    const {
      targetUserId,
      data: { threadId, authorId, streamId, commentId }
    } = msg

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
      msg,
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

/**
 * Notification that is triggered when a user is mentioned in a comment
 */
const handler: NotificationHandler<MentionedInCommentMessage> = async (...args) => {
  const mentionedInCommentHandler = mentionedInCommentHandlerFactory({
    getUser: getUserFactory({ db }),
    getStream: getStreamFactory({ db }),
    getCommentResolver: ({ projectDb }) => getCommentFactory({ db: projectDb }),
    getServerInfo: getServerInfoFactory({ db }),
    renderEmail,
    sendEmail
  })
  return mentionedInCommentHandler(...args)
}

export default handler
