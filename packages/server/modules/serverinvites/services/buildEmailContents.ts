import { ServerInfo, UserRecord } from '@/modules/core/helpers/types'
import { ServerInviteRecord } from '../helpers/types'
import { getServerInfo } from '@/modules/core/services/generic'
import { ResourceTargets, isServerInvite } from '../helpers/inviteHelper'
import {
  getRegistrationRoute,
  getStreamRoute
} from '@/modules/core/helpers/routeHelper'
import { getFrontendOrigin } from '@/modules/shared/helpers/envHelper'
import { InviteCreateValidationError } from '../errors'
import {
  EmailTemplateParams,
  renderEmail
} from '@/modules/emails/services/emailRendering'
import sanitizeHtml from 'sanitize-html'
import { CreateInviteParams } from '../domain'

type InviteOrInputParams =
  | CreateInviteParams
  | Pick<
      ServerInviteRecord,
      | 'id'
      | 'target'
      | 'inviterId'
      | 'message'
      | 'resourceTarget'
      | 'resourceId'
      | 'role'
      | 'token'
      | 'serverRole'
    >

/**
 * Build invite email contents
 */
export async function buildEmailContents(
  invite: Pick<
    ServerInviteRecord,
    | 'id'
    | 'target'
    | 'inviterId'
    | 'message'
    | 'resourceTarget'
    | 'resourceId'
    | 'role'
    | 'token'
    | 'serverRole'
  >,
  inviter: UserRecord,
  resource?: { name: string } | null,
  targetUser?: UserRecord | null
): Promise<{ to: string; subject: string; text: string; html: string }> {
  const email = targetUser ? targetUser.email : invite.target
  const serverInfo = await getServerInfo()
  const inviteLink = buildInviteLink(invite)
  const resourceName = resolveResourceName(invite, resource)

  const templateParams = buildEmailTemplateParams(
    invite,
    inviter,
    serverInfo,
    inviteLink,
    resourceName
  )
  const subject = buildEmailSubject(invite, inviter, resourceName)

  const { text, html } = await renderEmail(
    templateParams,
    serverInfo,
    targetUser || null
  )
  return {
    to: email,
    subject,
    text,
    html
  }
}

function buildInviteLink(
  invite: Pick<
    ServerInviteRecord,
    | 'id'
    | 'target'
    | 'inviterId'
    | 'message'
    | 'resourceTarget'
    | 'resourceId'
    | 'role'
    | 'token'
    | 'serverRole'
  >
) {
  const { resourceTarget, resourceId, token } = invite

  if (isServerInvite(invite)) {
    return new URL(
      `${getRegistrationRoute()}?token=${token}`,
      getFrontendOrigin()
    ).toString()
  }

  if (resourceTarget === 'streams') {
    return new URL(
      `${getStreamRoute(resourceId!)}?token=${token}&accept=true`,
      getFrontendOrigin()
    ).toString()
  } else {
    throw new InviteCreateValidationError('Unexpected resource target type')
  }
}

/**
 * Build the email subject line
 */
function buildEmailSubject(
  invite: Pick<
    ServerInviteRecord,
    | 'id'
    | 'target'
    | 'inviterId'
    | 'message'
    | 'resourceTarget'
    | 'resourceId'
    | 'role'
    | 'token'
    | 'serverRole'
  >,
  inviter: UserRecord,
  resourceName: string | null
): string {
  const { resourceTarget } = invite

  if (isServerInvite(invite)) {
    return 'Speckle Invitation from ' + inviter.name
  }

  if (resourceTarget === 'streams') {
    return `${inviter.name} wants to share the project "${resourceName}" on Speckle with you`
  } else {
    throw new InviteCreateValidationError('Unexpected resource target type')
  }
}

function buildEmailTemplateParams(
  invite: Pick<
    ServerInviteRecord,
    | 'id'
    | 'target'
    | 'inviterId'
    | 'message'
    | 'resourceTarget'
    | 'resourceId'
    | 'role'
    | 'token'
    | 'serverRole'
  >,
  inviter: UserRecord,
  serverInfo: ServerInfo,
  inviteLink: string,
  resourceName: string | null
): EmailTemplateParams {
  return {
    mjml: buildMjmlPreamble(invite, inviter, serverInfo, resourceName), // TODO: what happens when resourceName is null?
    text: buildTextPreamble(invite, inviter, serverInfo, resourceName), // TODO: what happens when resourceName is null?
    cta: {
      title: 'Accept the invitation',
      url: inviteLink
    }
  }
}

function buildMjmlPreamble(
  invite: Pick<
    ServerInviteRecord,
    | 'id'
    | 'target'
    | 'inviterId'
    | 'message'
    | 'resourceTarget'
    | 'resourceId'
    | 'role'
    | 'token'
    | 'serverRole'
  >,
  inviter: UserRecord,
  serverInfo: ServerInfo,
  resourceName: string | null
) {
  const { message } = invite
  const forServer = isServerInvite(invite)

  const dynamicText = forServer
    ? `join the <b>${serverInfo.name}</b> Speckle Server`
    : `become a collaborator on the <b>${resourceName}</b> project`

  const bodyStart = `
  <mj-text>
  Hello!
  <br />
  <br />
  ${inviter.name} has just sent you this invitation to ${dynamicText}!
  ${message ? inviter.name + ' said: <em>"' + message + '"</em>' : ''}
  </mj-text>
  `

  return {
    bodyStart,
    bodyEnd:
      '<mj-text>Feel free to ignore this invite if you do not know the person sending it.</mj-text>'
  }
}

function buildTextPreamble(
  invite: Pick<
    ServerInviteRecord,
    | 'id'
    | 'target'
    | 'inviterId'
    | 'message'
    | 'resourceTarget'
    | 'resourceId'
    | 'role'
    | 'token'
    | 'serverRole'
  >,
  inviter: UserRecord,
  serverInfo: ServerInfo,
  resourceName: string | null
) {
  const { message } = invite
  const forServer = isServerInvite(invite)

  const dynamicText = forServer
    ? `join the ${serverInfo.name} Speckle Server`
    : `become a collaborator on the "${resourceName}" project`

  const bodyStart = `Hello!

${inviter.name} has just sent you this invitation to ${dynamicText}!

${message ? inviter.name + ' said: "' + sanitizeMessage(message, true) + '"' : ''}`

  return {
    bodyStart,
    bodyEnd: 'Feel free to ignore this invite if you do not know the person sending it.'
  }
}

/**
 * Sanitize message that potentially has HTML in it
 */
function sanitizeMessage(message: string, stripAll: boolean = false): string {
  return sanitizeHtml(message, {
    allowedTags: stripAll ? [] : ['b', 'i', 'em', 'strong']
  })
}

function resolveResourceName(
  params: InviteOrInputParams,
  resource?: { name: string } | null
) {
  const { resourceTarget } = params

  if (resourceTarget === ResourceTargets.Streams) {
    return resource?.name || null
  }

  return null
}
