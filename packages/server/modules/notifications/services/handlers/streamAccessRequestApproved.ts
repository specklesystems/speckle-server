import {
  buildAbsoluteUrlFromRoute,
  getStreamRoute
} from '@/modules/core/helpers/routeHelper'
import { getStream } from '@/modules/core/repositories/streams'
import { getUser } from '@/modules/core/repositories/users'
import { sendEmail } from '@/modules/emails/services/sending'
import {
  BasicEmailTemplateParams,
  buildBasicTemplateEmail
} from '@/modules/emails/services/templateFormatting'
import { NotificationValidationError } from '@/modules/notifications/errors'
import {
  NotificationHandler,
  StreamAccessRequestApprovedMessage
} from '@/modules/notifications/helpers/types'

async function validateMessage(msg: StreamAccessRequestApprovedMessage) {
  const {
    targetUserId,
    data: {
      request: { resourceId },
      finalizedBy
    }
  } = msg

  const [targetUser, finalizer, stream] = await Promise.all([
    getUser(targetUserId),
    getUser(finalizedBy),
    getStream({ streamId: resourceId, userId: targetUserId })
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

type ValidatedMessageState = Awaited<ReturnType<typeof validateMessage>>

function buildEmailTemplateHtml(
  state: ValidatedMessageState
): BasicEmailTemplateParams['html'] {
  const { stream } = state

  return {
    bodyStart: `Hello,<br/>
<br/>
You have just been granted access to the <b>${stream.name}</b> stream. Check it out below:
`,
    bodyEnd: `You received this email because you requested access to this stream`
  }
}

function buildEmailTemplateText(
  state: ValidatedMessageState
): BasicEmailTemplateParams['text'] {
  const { stream } = state

  return {
    bodyStart: `Hello,\n\nYou have just been granted access to the ${stream.name} stream. Check it below:`,
    bodyEnd: `You received this email because you requested access to this stream`
  }
}

function buildEmailTemplateParams(
  state: ValidatedMessageState
): BasicEmailTemplateParams {
  const { stream } = state
  return {
    html: buildEmailTemplateHtml(state),
    text: buildEmailTemplateText(state),
    cta: {
      title: 'View Stream',
      url: buildAbsoluteUrlFromRoute(getStreamRoute(stream.id))
    }
  }
}

const handler: NotificationHandler<StreamAccessRequestApprovedMessage> = async (
  msg
) => {
  const state = await validateMessage(msg)
  const htmlTemplateParams = buildEmailTemplateParams(state)
  const { html, text } = await buildBasicTemplateEmail(htmlTemplateParams)

  await sendEmail({
    to: state.targetUser.email,
    text,
    html,
    subject: 'Your stream access request has been approved'
  })
}

export default handler
