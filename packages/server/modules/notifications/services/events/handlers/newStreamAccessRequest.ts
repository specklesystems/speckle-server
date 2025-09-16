import {
  AccessRequestType,
  getPendingAccessRequestFactory
} from '@/modules/accessrequests/repositories'
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
import type { EventBusPayloads } from '@/modules/shared/services/eventBus'
import type { SaveUserNotifications } from '@/modules/notifications/domain/operations'
import { NotificationType } from '@/modules/notifications/helpers/types'
import cryptoRandomString from 'crypto-random-string'
import { saveUserNotificationsFactory } from '@/modules/notifications/repositories/userNotification'

type ValidateMessageDeps = {
  getPendingAccessRequest: GetPendingAccessRequest
  getUser: GetUser
  getStream: GetStream
  getStreamCollaborators: GetStreamCollaborators
}

const validateMessageFactory =
  (deps: ValidateMessageDeps) =>
  async ({ payload }: { payload: EventBusPayloads['accessrequests.created'] }) => {
    const {
      request: { id: requestId, resourceId: streamId }
    } = payload

    if (!streamId) throw new NotificationValidationError('No stream ID provided')

    const stream = await deps.getStream({ streamId })
    if (!stream) throw new NotificationValidationError('Nonexistant stream')

    const request = await deps.getPendingAccessRequest(
      requestId,
      AccessRequestType.Stream
    )
    if (!request)
      throw new NotificationValidationError('Nonexistant stream access request')

    const owners = await deps.getStreamCollaborators(streamId, Roles.Stream.Owner)
    if (!owners.length) throw new NotificationValidationError('Stream has no owners')

    const requester = await deps.getUser(request.requesterId)
    if (!requester)
      throw new NotificationValidationError(
        'User who made the request no longer exists'
      )

    const targetUsers = []
    for (const owner of owners) {
      const [user, streamWithRole] = await Promise.all([
        deps.getUser(owner.id),
        deps.getStream({
          streamId: request.resourceId,
          userId: owner.id
        })
      ])

      if (!user) throw new NotificationValidationError('User no longer exists')
      if (!streamWithRole) throw new NotificationValidationError('Nonexistant stream')
      if (streamWithRole.role !== Roles.Stream.Owner)
        throw new NotificationValidationError(
          'Only stream owners can receive notifications about stream access requests'
        )

      targetUsers.push(user)
    }

    return {
      request,
      stream,
      targetUsers,
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

const newStreamAccessRequestHandlerFactory =
  (
    deps: {
      getServerInfo: GetServerInfo
      renderEmail: typeof renderEmail
      sendEmail: typeof sendEmail
      saveUserNotifications: SaveUserNotifications
    } & ValidateMessageDeps
  ) =>
  async (args: { payload: EventBusPayloads['accessrequests.created'] }) => {
    const state = await validateMessageFactory(deps)(args)
    const now = new Date()
    const notifications = []
    for (const targetUser of state.targetUsers) {
      const htmlTemplateParams = buildEmailTemplateParams({
        ...state
      })

      notifications.push({
        id: cryptoRandomString({ length: 10 }),
        userId: targetUser.id,
        notificationType: NotificationType.NewStreamAccessRequest,
        read: false,
        payload: {
          requestId: state.request.id,
          commentId: state.requester.id,
          streamId: state.stream.id
        },
        sendEmailAt: null,
        createdAt: now,
        updatedAt: now
      })

      const serverInfo = await deps.getServerInfo()
      const { html, text } = await deps.renderEmail(
        htmlTemplateParams,
        serverInfo,
        targetUser
      )

      await deps.sendEmail({
        to: targetUser.email,
        text,
        html,
        subject: 'A user requested access to your project'
      })
    }
    await deps.saveUserNotifications(notifications)
  }

export const handler = (args: {
  payload: EventBusPayloads['accessrequests.created'] // TODO: smarter typing
}) => {
  const newStreamAccessRequestHandler = newStreamAccessRequestHandlerFactory({
    getServerInfo: getServerInfoFactory({ db }),
    renderEmail,
    sendEmail,
    getUser: getUserFactory({ db }),
    getStream: getStreamFactory({ db }),
    getPendingAccessRequest: getPendingAccessRequestFactory({ db }),
    getStreamCollaborators: getStreamCollaboratorsFactory({ db }),
    saveUserNotifications: saveUserNotificationsFactory({ db })
  })
  return newStreamAccessRequestHandler(args)
}

export default handler
