import { db } from '@/db/knex'
import { GetStream } from '@/modules/core/domain/streams/operations'
import {
  buildAbsoluteFrontendUrlFromPath,
  getStreamRoute
} from '@/modules/core/helpers/routeHelper'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { getUser } from '@/modules/core/repositories/users'
import { getServerInfo } from '@/modules/core/services/generic'
import {
  EmailTemplateParams,
  renderEmail
} from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { NotificationValidationError } from '@/modules/notifications/errors'
import {
  NotificationHandler,
  StreamAccessRequestApprovedMessage
} from '@/modules/notifications/helpers/types'

type ValidateMessageDeps = {
  getUser: typeof getUser
  getStream: GetStream
}

const validateMessageFactory =
  (deps: ValidateMessageDeps) => async (msg: StreamAccessRequestApprovedMessage) => {
    const {
      targetUserId,
      data: {
        request: { resourceId },
        finalizedBy
      }
    } = msg

    const [targetUser, finalizer, stream] = await Promise.all([
      deps.getUser(targetUserId),
      deps.getUser(finalizedBy),
      deps.getStream({ streamId: resourceId, userId: targetUserId })
    ])

    if (!targetUser)
      throw new NotificationValidationError('Invalid notification target user')
    if (!finalizer)
      throw new NotificationValidationError('Invalid notification finalizer')
    if (!stream) throw new NotificationValidationError('Invalid stream')
    if (!stream.role)
      throw new NotificationValidationError(
        'User doesnt appear to have a role on the stream'
      )

    return { targetUser, finalizer, stream }
  }

type ValidatedMessageState = Awaited<
  ReturnType<ReturnType<typeof validateMessageFactory>>
>

function buildEmailTemplateMjml(
  state: ValidatedMessageState
): EmailTemplateParams['mjml'] {
  const { stream } = state

  return {
    bodyStart: `<mj-text>
Hello,<br/>
<br/>
You have just been granted access to the <b>${stream.name}</b> project. Check it out below:
</mj-text>
`,
    bodyEnd: `<mj-text>
You received this email because you requested access to this project
</mj-text>`
  }
}

function buildEmailTemplateText(
  state: ValidatedMessageState
): EmailTemplateParams['text'] {
  const { stream } = state

  return {
    bodyStart: `Hello,\n\nYou have just been granted access to the ${stream.name} stream. Check it below:`,
    bodyEnd: `You received this email because you requested access to this stream`
  }
}

function buildEmailTemplateParams(state: ValidatedMessageState): EmailTemplateParams {
  const { stream } = state
  return {
    mjml: buildEmailTemplateMjml(state),
    text: buildEmailTemplateText(state),
    cta: {
      title: 'View Stream',
      url: buildAbsoluteFrontendUrlFromPath(getStreamRoute(stream.id))
    }
  }
}

const streamAccessRequestApprovedHandlerFactory =
  (
    deps: {
      getServerInfo: typeof getServerInfo
      renderEmail: typeof renderEmail
      sendEmail: typeof sendEmail
    } & ValidateMessageDeps
  ): NotificationHandler<StreamAccessRequestApprovedMessage> =>
  async (msg) => {
    const state = await validateMessageFactory(deps)(msg)
    const htmlTemplateParams = buildEmailTemplateParams(state)
    const serverInfo = await deps.getServerInfo()
    const { html, text } = await deps.renderEmail(
      htmlTemplateParams,
      serverInfo,
      state.targetUser
    )

    await deps.sendEmail({
      to: state.targetUser.email,
      text,
      html,
      subject: 'Your project access request has been approved'
    })
  }

const handler: NotificationHandler<StreamAccessRequestApprovedMessage> = async (
  ...args
) => {
  const streamAccessRequestApprovedHandler = streamAccessRequestApprovedHandlerFactory({
    getServerInfo,
    renderEmail,
    sendEmail,
    getUser,
    getStream: getStreamFactory({ db })
  })
  return streamAccessRequestApprovedHandler(...args)
}

export default handler
