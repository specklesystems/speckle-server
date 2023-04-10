const crs = require('crypto-random-string')
const { getServerInfo } = require('@/modules/core/services/generic')
const { sendEmail } = require('@/modules/emails')
const { InviteCreateValidationError } = require('@/modules/serverinvites/errors')
const { authorizeResolver } = require('@/modules/shared')
const {
  insertInviteAndDeleteOld,
  getUserFromTarget,
  getResource
} = require('@/modules/serverinvites/repositories')
const { getStreamCollaborator } = require('@/modules/core/repositories/streams')
const { Roles } = require('@/modules/core/helpers/mainConstants')
const sanitizeHtml = require('sanitize-html')
const {
  getRegistrationRoute,
  getStreamRoute
} = require('@/modules/core/helpers/routeHelper')
const {
  isServerInvite,
  resolveTarget,
  buildUserTarget,
  ResourceTargets
} = require('@/modules/serverinvites/helpers/inviteHelper')
const { getUsers, getUser } = require('@/modules/core/repositories/users')
const {
  addStreamInviteSentOutActivity
} = require('@/modules/activitystream/services/streamActivity')
const { renderEmail } = require('@/modules/emails/services/emailRendering')

/**
 * @typedef {{
 *  target: string;
 *  inviterId: string;
 *  message?: string;
 *  resourceTarget?: string;
 *  resourceId?: string;
 *  role?: string;
 * }} CreateInviteParams
 */

/**
 * @typedef {CreateInviteParams|import('@/modules/serverinvites/helpers/types').ServerInviteRecord} InviteOrInputParams
 */

/**
 * @param {InviteOrInputParams} params
 * @param {Object | null} resource invite resource (e.g. stream)
 */
function resolveResourceName(params, resource) {
  const { resourceTarget } = params

  if (resourceTarget === ResourceTargets.Streams) {
    return resource.name
  }

  return null
}

/**
 * Validate that the inviter has access to the resources he's trying to invite people to
 * @param {CreateInviteParams} params
 * @param {import('@/modules/core/helpers/userHelper').UserRecord} inviter
 */
async function validateInviter(params, inviter) {
  const { resourceId, resourceTarget } = params
  if (!inviter) throw new InviteCreateValidationError('Invalid inviter')
  if (isServerInvite(params)) return

  try {
    if (resourceTarget === ResourceTargets.Streams) {
      await authorizeResolver(inviter.id, resourceId, Roles.Stream.Owner)
    } else {
      throw new InviteCreateValidationError('Unexpected resource target type')
    }
  } catch (e) {
    throw new InviteCreateValidationError(
      "Inviter doesn't have proper access to the resource",
      { cause: e }
    )
  }
}

/**
 * Validate the target
 * @param {CreateInviteParams} params
 * @param {import('@/modules/core/helpers/userHelper').UserRecord | undefined} targetUser
 */
function validateTargetUser(params, targetUser) {
  const { target } = params
  const { userId } = resolveTarget(target)

  if (userId && !targetUser) {
    throw new InviteCreateValidationError('Attempting to invite an invalid user')
  }

  if (isServerInvite(params) && targetUser) {
    throw new InviteCreateValidationError(
      'This email is already associated with an account on this server'
    )
  }
}

/**
 * Validate the target resource
 * @param {CreateInviteParams} params
 * @param {Object | null} resource
 * @param {import('@/modules/core/helpers/userHelper').UserRecord | undefined} targetUser Target user, if one exists in our DB
 */
async function validateResource(params, resource, targetUser) {
  const { resourceId, resourceTarget, role } = params

  if (resourceId && !resource) {
    throw new InviteCreateValidationError("Couldn't resolve invite resource")
  }

  if (resourceTarget === ResourceTargets.Streams) {
    if (targetUser) {
      // Check if user isn't already associated with the stream
      const isStreamCollaborator = !!(await getStreamCollaborator(
        resourceId,
        targetUser.id
      ))
      if (isStreamCollaborator) {
        throw new InviteCreateValidationError(
          'The target user is already a collaborator of the specified stream'
        )
      }
    }

    if (!Object.values(Roles.Stream).includes(role)) {
      throw new InviteCreateValidationError('Unexpected stream invite role')
    }
  }
}

/**
 * Validate invite creation input data
 * @param {CreateInviteParams} params
 * @param {import('@/modules/core/helpers/userHelper').UserRecord} inviter Inviter, resolved from DB
 * @param {import('@/modules/core/helpers/userHelper').UserRecord | undefined} targetUser Target user, if one exists in our DB
 * @param {Object | null} resource Invite resource (stream or null)
 */
async function validateInput(params, inviter, targetUser, resource) {
  const { message } = params

  // validate inviter & invitee
  validateTargetUser(params, targetUser)
  await validateInviter(params, inviter)

  // validate resource
  await validateResource(params, resource, targetUser)

  // check if message too long
  if (message) {
    if (message.length >= 1024) {
      throw new InviteCreateValidationError('Personal message too long')
    }
  }
}

/**
 * Sanitize message that potentially has HTML in it
 * @param {string} message
 * @returns {string}
 */
function sanitizeMessage(message, stripAll = false) {
  return sanitizeHtml(message, {
    allowedTags: stripAll ? [] : [('b', 'i', 'em', 'strong')]
  })
}

/**
 * Build the email subject line
 * @param {import('@/modules/serverinvites/helpers/types').ServerInviteRecord} invite
 * @param {import('@/modules/core/helpers/userHelper').UserRecord} inviter
 * @param {string | null} resourceName
 * @returns {string}
 */
function buildEmailSubject(invite, inviter, resourceName) {
  const { resourceTarget } = invite

  if (isServerInvite(invite)) {
    return 'Speckle Invitation from ' + inviter.name
  }

  if (resourceTarget === 'streams') {
    return `${inviter.name} wants to share the stream "${resourceName}" on Speckle with you`
  } else {
    throw new InviteCreateValidationError('Unexpected resource target type')
  }
}

/**
 * Build invite link URL
 * @param {import('@/modules/serverinvites/helpers/types').ServerInviteRecord} invite
 * @returns {string}
 */
function buildInviteLink(invite) {
  const { resourceTarget, resourceId, token } = invite

  if (isServerInvite(invite)) {
    return new URL(
      `${getRegistrationRoute()}?token=${token}`,
      process.env.CANONICAL_URL
    ).toString()
  }

  if (resourceTarget === 'streams') {
    return new URL(
      `${getStreamRoute(resourceId)}?token=${token}`,
      process.env.CANONICAL_URL
    ).toString()
  } else {
    throw new InviteCreateValidationError('Unexpected resource target type')
  }
}

function buildMjmlPreamble(invite, inviter, serverInfo, resourceName) {
  const { message } = invite
  const forServer = isServerInvite(invite)

  const dynamicText = forServer
    ? `join the <b>${serverInfo.name}</b> Speckle Server`
    : `become a collaborator on the <b>${resourceName}</b> stream`

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

function buildTextPreamble(invite, inviter, serverInfo, resourceName) {
  const { message } = invite
  const forServer = isServerInvite(invite)

  const dynamicText = forServer
    ? `join the ${serverInfo.name} Speckle Server`
    : `become a collaborator on the "${resourceName}" stream`

  const bodyStart = `Hello!

${inviter.name} has just sent you this invitation to ${dynamicText}!

${message ? inviter.name + ' said: "' + sanitizeMessage(message, true) + '"' : ''}`

  return {
    bodyStart,
    bodyEnd: 'Feel free to ignore this invite if you do not know the person sending it.'
  }
}

/**
 * @param {import('@/modules/serverinvites/helpers/types').ServerInviteRecord} invite
 * @param {import('@/modules/core/helpers/userHelper').UserRecord} inviter
 * @param {import('@/modules/core/helpers/types').ServerInfo} serverInfo
 * @param {string} resourceName
 * @returns {import('@/modules/emails/services/emailRendering').EmailTemplateParams}
 */
function buildEmailTemplateParams(
  invite,
  inviter,
  serverInfo,
  inviteLink,
  resourceName
) {
  return {
    mjml: buildMjmlPreamble(invite, inviter, serverInfo, resourceName),
    text: buildTextPreamble(invite, inviter, serverInfo, resourceName),
    cta: {
      title: 'Accept the invitation',
      url: inviteLink
    }
  }
}

/**
 * Build invite email contents
 * @param {import('@/modules/serverinvites/helpers/types').ServerInviteRecord} invite
 * @param {import('@/modules/core/helpers/userHelper').UserRecord} inviter
 * @param {import('@/modules/core/helpers/userHelper').UserRecord | undefined} targetUser
 * @param {Object | null} resource
 * @returns {Promise<{to: string, subject: string, text: string, html: string}>}
 */
async function buildEmailContents(invite, inviter, targetUser, resource) {
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

/**
 * Create and send out an invite
 * @param {CreateInviteParams} params
 * @returns {Promise<string>} The ID of the created invite
 */
async function createAndSendInvite(params) {
  const { inviterId, resourceTarget, resourceId, role } = params
  let { message, target } = params

  const inviter = await getUser(inviterId)
  const targetUser = await getUserFromTarget(target)
  const resource = await getResource(params)

  // if target user found, always use the user ID
  if (targetUser) target = buildUserTarget(targetUser.id)
  const { userEmail, userId } = resolveTarget(target)

  // validate inputs
  await validateInput(params, inviter, targetUser, resource)

  // Sanitize msg
  // TODO: We should just use TipTap here
  if (message) {
    message = sanitizeMessage(message)
  }

  // write to DB
  const invite = {
    id: crs({ length: 20 }),
    target,
    inviterId,
    message,
    resourceTarget,
    resourceId,
    role,
    token: crs({ length: 50 })
  }
  await insertInviteAndDeleteOld(
    invite,
    targetUser ? [targetUser.email, buildUserTarget(targetUser.id)] : []
  )

  // generate and send email
  const emailParams = await buildEmailContents(invite, inviter, targetUser, resource)

  // send email and create activity stream item, if stream invite
  await Promise.all([
    sendEmail(emailParams),
    ...(resourceTarget === ResourceTargets.Streams
      ? [
          addStreamInviteSentOutActivity({
            streamId: resourceId,
            inviterId,
            inviteTargetEmail: userEmail,
            inviteTargetId: userId
          })
        ]
      : [])
  ])

  return {
    inviteId: invite.id,
    token: invite.token
  }
}

/**
 * Re-send existing invite email
 * @param {import('@/modules/serverinvites/helpers/types').ServerInviteRecord} invite
 */
async function resendInviteEmail(invite) {
  const { inviterId, target } = invite

  const [inviter, targetUser, resource] = await Promise.all([
    getUser(inviterId),
    getUserFromTarget(target),
    getResource(invite)
  ])

  const emailParams = await buildEmailContents(invite, inviter, targetUser, resource)
  await sendEmail(emailParams)
}

/**
 * Invite users to be contributors for the specified stream
 * @param {string} inviterId
 * @param {string} streamId
 * @param {string[]} userIds
 * @returns {Promise<boolean>}
 */
async function inviteUsersToStream(inviterId, streamId, userIds) {
  const users = await getUsers(userIds)
  if (!users.length) return false

  const inviteParamsArray = users.map((u) => ({
    target: buildUserTarget(u.id),
    inviterId,
    resourceTarget: ResourceTargets.Streams,
    resourceId: streamId,
    role: Roles.Stream.Contributor
  }))

  await Promise.all(inviteParamsArray.map((p) => createAndSendInvite(p)))

  return true
}

module.exports = {
  createAndSendInvite,
  resendInviteEmail,
  inviteUsersToStream
}
