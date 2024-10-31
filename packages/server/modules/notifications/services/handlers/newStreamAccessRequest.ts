import {
  AccessRequestType,
  getPendingAccessRequestFactory
} from '@/modules/accessrequests/repositories'
import {
  NewStreamAccessRequestMessage,
  NotificationHandler
} from '@/modules/notifications/helpers/types'
import { NotificationValidationError } from '@/modules/notifications/errors'
import { Roles } from '@/modules/core/helpers/mainConstants'
import {
  buildAbsoluteFrontendUrlFromPath,
  getStreamCollaboratorsRoute
} from '@/modules/core/helpers/routeHelper'
import { sendEmail } from '@/modules/emails/services/sending'
import {
  EmailTemplateParams,
  renderEmail
} from '@/modules/emails/services/emailRendering'
import { db } from '@/db/knex'
import { GetPendingAccessRequest } from '@/modules/accessrequests/domain/operations'
import { GetStream } from '@/modules/core/domain/streams/operations'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { GetUser } from '@/modules/core/domain/users/operations'
import { getUserFactory } from '@/modules/core/repositories/users'
import { GetServerInfo } from '@/modules/core/domain/server/operations'
import { getServerInfoFactory } from '@/modules/core/repositories/server'

type ValidateMessageDeps = {
  getPendingAccessRequest: GetPendingAccessRequest
  getUser: GetUser
  getStream: GetStream
}

const validateMessageFactory =
  (deps: ValidateMessageDeps) => async (msg: NewStreamAccessRequestMessage) => {
    const {
      targetUserId,
      data: { requestId }
    } = msg

    const [request, user] = await Promise.all([
      deps.getPendingAccessRequest(requestId, AccessRequestType.Stream),
      deps.getUser(targetUserId)
    ])

    if (!request)
      throw new NotificationValidationError('Nonexistant stream access request')
    if (!user) throw new NotificationValidationError('Nonexistant user')

    const [streamWithRole, requester] = await Promise.all([
      deps.getStream({
        streamId: request.resourceId,
        userId: targetUserId
      }),
      deps.getUser(request.requesterId)
    ])

    if (!streamWithRole) throw new NotificationValidationError('Nonexistant stream')
    if (streamWithRole.role !== Roles.Stream.Owner)
      throw new NotificationValidationError(
        'Only stream owners can receive notifications about stream access requests'
      )
    if (!requester)
      throw new NotificationValidationError(
        'User who made the request no longer exists'
      )

    return {
      request,
      stream: streamWithRole,
      targetUser: user,
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
    bodyStart: `<mj-text>
Hello,<br/>
<br/>
<b>${requester.name}</b> requested access to the <b>${stream.name}</b> project.
You can add them as a collaborator by clicking the button below.
</mj-text>
`,
    bodyEnd: `<mj-text>
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
    } & ValidateMessageDeps
  ): NotificationHandler<NewStreamAccessRequestMessage> =>
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
      subject: 'A user requested access to your project'
    })
  }

const handler: NotificationHandler<NewStreamAccessRequestMessage> = (...args) => {
  const newStreamAccessRequestHandler = newStreamAccessRequestHandlerFactory({
    getServerInfo: getServerInfoFactory({ db }),
    renderEmail,
    sendEmail,
    getUser: getUserFactory({ db }),
    getStream: getStreamFactory({ db }),
    getPendingAccessRequest: getPendingAccessRequestFactory({ db })
  })
  return newStreamAccessRequestHandler(...args)
}

export default handler
