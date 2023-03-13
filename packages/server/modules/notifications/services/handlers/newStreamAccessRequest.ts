import {
  AccessRequestType,
  getPendingAccessRequest
} from '@/modules/accessrequests/repositories'
import { getUser } from '@/modules/core/repositories/users'
import {
  NewStreamAccessRequestMessage,
  NotificationHandler
} from '@/modules/notifications/helpers/types'
import { NotificationValidationError } from '@/modules/notifications/errors'
import { getStream } from '@/modules/core/repositories/streams'
import { Roles } from '@/modules/core/helpers/mainConstants'
import {
  buildAbsoluteUrlFromRoute,
  getStreamCollaboratorsRoute
} from '@/modules/core/helpers/routeHelper'
import { sendEmail } from '@/modules/emails/services/sending'
import {
  EmailTemplateParams,
  renderEmail
} from '@/modules/emails/services/emailRendering'
import { getServerInfo } from '@/modules/core/services/generic'

async function validateMessage(msg: NewStreamAccessRequestMessage) {
  const {
    targetUserId,
    data: { requestId }
  } = msg

  const [request, user] = await Promise.all([
    getPendingAccessRequest(requestId, AccessRequestType.Stream),
    getUser(targetUserId)
  ])

  if (!request)
    throw new NotificationValidationError('Nonexistant stream access request')
  if (!user) throw new NotificationValidationError('Nonexistant user')

  const [streamWithRole, requester] = await Promise.all([
    getStream({
      streamId: request.resourceId,
      userId: targetUserId
    }),
    getUser(request.requesterId)
  ])

  if (!streamWithRole) throw new NotificationValidationError('Nonexistant stream')
  if (streamWithRole.role !== Roles.Stream.Owner)
    throw new NotificationValidationError(
      'Only stream owners can receive notifications about stream access requests'
    )
  if (!requester)
    throw new NotificationValidationError('User who made the request no longer exists')

  return {
    request,
    stream: streamWithRole,
    targetUser: user,
    requester
  }
}

type ValidatedMessageState = Awaited<ReturnType<typeof validateMessage>>

function buildEmailTemplateHtml(
  state: ValidatedMessageState
): EmailTemplateParams['mjml'] {
  const { requester, stream } = state

  return {
    bodyStart: `<mj-text>
Hello,<br/>
<br/>
<b>${requester.name}</b> requested access to the <b>${stream.name}</b> stream.
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
    bodyStart: `Hello,\n\n${requester.name} requested access to the ${stream.name} stream. You can add them as a collaborator by opening the link below.`,
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
      url: buildAbsoluteUrlFromRoute(getStreamCollaboratorsRoute(stream.id))
    }
  }
}

const handler: NotificationHandler<NewStreamAccessRequestMessage> = async (msg) => {
  const state = await validateMessage(msg)
  const htmlTemplateParams = buildEmailTemplateParams(state)
  const serverInfo = await getServerInfo()
  const { html, text } = await renderEmail(
    htmlTemplateParams,
    serverInfo,
    state.targetUser
  )

  await sendEmail({
    to: state.targetUser.email,
    text,
    html,
    subject: 'A user requested access to your stream'
  })
}

export default handler
