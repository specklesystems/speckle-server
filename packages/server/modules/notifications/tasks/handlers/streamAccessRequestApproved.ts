import { db } from '@/db/knex'
import type { GetServerInfo } from '@/modules/core/domain/server/operations'
import type { GetStream } from '@/modules/core/domain/streams/operations'
import type { GetUser } from '@/modules/core/domain/users/operations'
import {
  buildAbsoluteFrontendUrlFromPath,
  getStreamRoute
} from '@/modules/core/helpers/routeHelper'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { getUserFactory } from '@/modules/core/repositories/users'
import type { EmailTemplateParams } from '@/modules/emails/domain/operations'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { sendEmail } from '@/modules/emails/services/sending'
import { NotificationValidationError } from '@/modules/notifications/errors'
import type { UserNotificationRecord } from '@/modules/notifications/helpers/types'
import type { NotificationType } from '@/modules/notifications/helpers/types'

type ValidateMessageDeps = {
  getUser: GetUser
  getStream: GetStream
}

type StreamAccessApprovedNotification = Extract<
  UserNotificationRecord,
  { type: NotificationType.StreamAccessRequestApproved }
>

const validateNotificationFactory =
  (deps: ValidateMessageDeps) =>
  async (notification: StreamAccessApprovedNotification) => {
    const streamId = notification.payload.streamId
    if (!streamId) throw new NotificationValidationError('No stream provided')

    const [targetUser, stream] = await Promise.all([
      deps.getUser(notification.userId),
      deps.getStream({ streamId, userId: notification.userId })
    ])

    if (!targetUser)
      throw new NotificationValidationError('Invalid notification target user')
    if (!stream) throw new NotificationValidationError('Invalid stream')
    if (!stream.role)
      throw new NotificationValidationError(
        'User doesnt appear to have a role on the stream'
      )

    return { targetUser, stream }
  }

type ValidatedMessageState = Awaited<
  ReturnType<ReturnType<typeof validateNotificationFactory>>
>

function buildEmailTemplateMjml(
  state: ValidatedMessageState
): EmailTemplateParams['mjml'] {
  const { stream } = state

  return {
    bodyStart: `<mj-text align="center" line-height="2" >
Hello,<br/>
<br/>
You have just been granted access to the <b>${stream.name}</b> project. Check it out below:
</mj-text>
`,
    bodyEnd: `<mj-text align="center" line-height="2" >
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

const steamAccessRequestFinalizedHandlerFactory =
  (
    deps: {
      getServerInfo: GetServerInfo
      renderEmail: typeof renderEmail
      sendEmail: typeof sendEmail
    } & ValidateMessageDeps
  ) =>
  async (notification: StreamAccessApprovedNotification) => {
    const state = await validateNotificationFactory(deps)(notification)

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

export const handler = async (notification: StreamAccessApprovedNotification) => {
  const steamAccessRequestFinalizedHandler = steamAccessRequestFinalizedHandlerFactory({
    getServerInfo: getServerInfoFactory({ db }),
    renderEmail,
    sendEmail,
    getUser: getUserFactory({ db }),
    getStream: getStreamFactory({ db })
  })
  return steamAccessRequestFinalizedHandler(notification)
}

export default handler
