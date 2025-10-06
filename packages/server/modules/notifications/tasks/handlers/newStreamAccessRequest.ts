import { getPendingAccessRequestFactory } from '@/modules/accessrequests/repositories'
import { NotificationValidationError } from '@/modules/notifications/errors'
import { Roles } from '@/modules/core/helpers/mainConstants'
import {
  buildAbsoluteFrontendUrlFromPath,
  getStreamCollaboratorsRoute
} from '@/modules/core/helpers/routeHelper'
import { sendEmail } from '@/modules/emails/services/sending'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { db } from '@/db/knex'
import type { GetPendingAccessRequest } from '@/modules/accessrequests/domain/operations'
import type {
  GetStream,
  GetStreamCollaborators
} from '@/modules/core/domain/streams/operations'
import {
  getStreamCollaboratorsFactory,
  getStreamFactory
} from '@/modules/core/repositories/streams'
import type { GetUser } from '@/modules/core/domain/users/operations'
import { getUserFactory } from '@/modules/core/repositories/users'
import type { GetServerInfo } from '@/modules/core/domain/server/operations'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import type { EmailTemplateParams } from '@/modules/emails/domain/operations'
import type { StoreUserNotifications } from '@/modules/notifications/domain/operations'
import type { UserNotificationRecord } from '@/modules/notifications/helpers/types'
import type { NotificationType } from '@speckle/shared/notifications'
import { storeUserNotificationsFactory } from '@/modules/notifications/repositories/userNotification'

type ValidateMessageDeps = {
  getPendingAccessRequest: GetPendingAccessRequest
  getUser: GetUser
  getStream: GetStream
  getStreamCollaborators: GetStreamCollaborators
}

type NewSreamAccessRequestNotification = Extract<
  UserNotificationRecord,
  { type: NotificationType.NewStreamAccessRequest }
>

const validateMessageFactory =
  (deps: ValidateMessageDeps) =>
  async (notification: NewSreamAccessRequestNotification) => {
    const { streamId, requesterId } = notification.payload
    const userId = notification.userId

    if (!streamId) throw new NotificationValidationError('No stream ID provided')

    const stream = await deps.getStream({ streamId })
    if (!stream) throw new NotificationValidationError('Nonexistant stream')

    const requester = await deps.getUser(requesterId)
    if (!requester)
      throw new NotificationValidationError(
        'User who made the request no longer exists'
      )

    const [targetUser, streamWithRole] = await Promise.all([
      deps.getUser(userId),
      deps.getStream({
        streamId,
        userId
      })
    ])

    if (!targetUser) throw new NotificationValidationError('User no longer exists')
    if (!streamWithRole) throw new NotificationValidationError('Nonexistant stream')
    if (streamWithRole.role !== Roles.Stream.Owner)
      throw new NotificationValidationError(
        'Only stream owners can receive notifications about stream access requests'
      )

    return {
      stream,
      targetUser,
      requester
    }
  }

type ValidatedMessageState = Awaited<
  ReturnType<ReturnType<typeof validateMessageFactory>>
>

function buildEmailTemplateHtml(
  state: ValidatedMessageState
): EmailTemplateParams['mjml'] {
  const { requester, stream } = state

  return {
    bodyStart: `<mj-text align="center" line-height="2" >
Hello,<br/>
<br/>
<b>${requester.name}</b> requested access to the <b>${stream.name}</b> project.
You can add them as a collaborator by clicking the button below.
</mj-text>
`,
    bodyEnd: `<mj-text align="center" padding-bottom="0px" line-height="2">
You received this email because you are an owner on <b>${stream.name}</b>.
</mj-text>`
  }
}

function buildEmailTemplateText(
  state: ValidatedMessageState
): EmailTemplateParams['text'] {
  const { requester, stream } = state

  return {
    bodyStart: `Hello,\n\n${requester.name} requested access to the ${stream.name} project. You can add them as a collaborator by opening the link below.`,
    bodyEnd: `You received this email because you are an owner on ${stream.name}`
  }
}

function buildEmailTemplateParams(state: ValidatedMessageState): EmailTemplateParams {
  const { stream } = state

  return {
    mjml: buildEmailTemplateHtml(state),
    text: buildEmailTemplateText(state),
    cta: {
      title: 'Review Request',
      url: buildAbsoluteFrontendUrlFromPath(getStreamCollaboratorsRoute(stream.id))
    }
  }
}

const newSreamAccessRequestHandlerFactory =
  (
    deps: {
      getServerInfo: GetServerInfo
      renderEmail: typeof renderEmail
      sendEmail: typeof sendEmail
      saveUserNotifications: StoreUserNotifications
    } & ValidateMessageDeps
  ) =>
  async (notification: NewSreamAccessRequestNotification) => {
    const state = await validateMessageFactory(deps)(notification)

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
      subject: 'A user requested access to your project'
    })
  }

export const handler = (notification: NewSreamAccessRequestNotification) => {
  const streamAccessRequestCreatedHandler = newSreamAccessRequestHandlerFactory({
    getServerInfo: getServerInfoFactory({ db }),
    renderEmail,
    sendEmail,
    getUser: getUserFactory({ db }),
    getStream: getStreamFactory({ db }),
    getPendingAccessRequest: getPendingAccessRequestFactory({ db }),
    getStreamCollaborators: getStreamCollaboratorsFactory({ db }),
    saveUserNotifications: storeUserNotificationsFactory({ db })
  })
  return streamAccessRequestCreatedHandler(notification)
}

export default handler
