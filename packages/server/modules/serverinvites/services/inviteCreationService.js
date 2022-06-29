const crs = require('crypto-random-string')
const { getServerInfo } = require('@/modules/core/services/generic')
const { sendEmail } = require('@/modules/emails')
const { InviteCreateValidationError } = require('@/modules/serverinvites/errors')
const { authorizeResolver } = require('@/modules/shared')
const {
  insertInviteAndDeleteOld,
  getUserFromTarget
} = require('@/modules/serverinvites/repositories')
const { getStream } = require('@/modules/core/repositories/streams')
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
 * @typedef {CreateInviteParams|import('@/modules/serverinvites/repositories').ServerInviteRecord} InviteOrInputParams
 */

/**
 * @param {InviteOrInputParams} params
 */
async function validateAndResolveResourceName(params) {
  if (isServerInvite(params)) return null
  const { resourceId, resourceTarget } = params

  if (!Object.values(ResourceTargets).includes(resourceTarget)) {
    throw new InviteCreateValidationError('Unexpected resource target type')
  }

  if (resourceTarget === ResourceTargets.Streams) {
    // Resolve stream name
    const stream = await getStream({ streamId: resourceId })
    if (!stream) {
      throw new InviteCreateValidationError(
        'Attempting to generate invite for a non-existant stream'
      )
    }

    return stream.name
  }

  throw new InviteCreateValidationError('Unexpected resource target type')
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
 * Validate invite creation input data
 * @param {CreateInviteParams} params
 * @param {import('@/modules/core/helpers/userHelper').UserRecord} inviter Inviter, resolved from DB
 * @param {import('@/modules/core/helpers/userHelper').UserRecord | undefined} targetUser Target user, if one exists in our DB
 */
async function validateInput(params, inviter, targetUser) {
  const { message } = params

  validateTargetUser(params, targetUser)
  await validateInviter(params, inviter)

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
function sanitizeMessage(message) {
  return sanitizeHtml(message, {
    allowedTags: ['b', 'i', 'em', 'strong']
  })
}

/**
 * Build email text version body
 */
function buildEmailTextBody(invite, inviter, serverInfo, inviteLink, resourceName) {
  const { message } = invite
  const forServer = isServerInvite(invite)

  const dynamicText = forServer
    ? `join the ${serverInfo.name} Speckle Server (${process.env.CANONICAL_URL})`
    : `become a collaborator on the ${serverInfo.name} Speckle Server (${process.env.CANONICAL_URL}) stream - "${resourceName}"`

  return `
Hello!

${
  inviter.name
} has just sent you this invitation to ${dynamicText}! To accept the invitation, open the following URL in your browser:
${inviteLink}

${message ? inviter.name + ' said: "' + message + '"' : ''}

Warm regards,
Speckle
---
This email was sent from ${serverInfo.name} at ${
    process.env.CANONICAL_URL
  }, deployed and managed by ${serverInfo.company}. Your admin contact is ${
    serverInfo.adminContact ? serverInfo.adminContact : '[not provided]'
  }.
      `
}

/**
 * Build email HTML version body
 */
function buildEmailHtmlBody(invite, inviter, serverInfo, inviteLink, resourceName) {
  const { message } = invite
  const forServer = isServerInvite(invite)

  const dynamicText = forServer
    ? `join the <a href="${process.env.CANONICAL_URL}" rel="notrack">${serverInfo.name} Speckle Server</a>`
    : `become a collaborator on the <a href="${process.env.CANONICAL_URL}" rel="notrack">${serverInfo.name} Speckle Server</a> stream - "${resourceName}"`

  return `
Hello!
<br>
<br>
${inviter.name} has just sent you this invitation to ${dynamicText}!
To accept the invitation, <a href="${inviteLink}" rel="notrack">click here</a>!

<br>
<br>
${message ? inviter.name + ' said: <em>"' + message + '"</em><br><br>' : ''}

Warm regards,
<br>
Speckle (on behalf of ${inviter.name})
<br>
<img src="https://speckle.systems/content/images/2021/02/logo_big-1.png" style="width:30px; height:30px;">
<br>
<br>
<caption style="size:8px; color:#7F7F7F; width:400px; text-align: left;">
This email was sent from ${serverInfo.name} at <a href="${
    process.env.CANONICAL_URL
  }" rel="notrack">${process.env.CANONICAL_URL}</a>, deployed and managed by ${
    serverInfo.company
  }. Your admin contact is ${
    serverInfo.adminContact ? serverInfo.adminContact : '[not provided]'
  }.
</caption>
`
}

/**
 * Build the email subject line
 * @param {import('@/modules/serverinvites/repositories').ServerInviteRecord} invite
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
 * @param {import('@/modules/serverinvites/repositories').ServerInviteRecord} invite
 * @returns {string}
 */
function buildInviteLink(invite) {
  const { id, resourceTarget, resourceId } = invite

  if (isServerInvite(invite)) {
    return new URL(
      `${getRegistrationRoute()}?inviteId=${id}`,
      process.env.CANONICAL_URL
    ).toString()
  }

  if (resourceTarget === 'streams') {
    return new URL(
      `${getStreamRoute(resourceId)}?inviteId=${id}`,
      process.env.CANONICAL_URL
    ).toString()
  } else {
    throw new InviteCreateValidationError('Unexpected resource target type')
  }
}

/**
 * Build invite email contents
 * @param {import('@/modules/serverinvites/repositories').ServerInviteRecord} invite
 * @param {import('@/modules/core/helpers/userHelper').UserRecord} inviter
 * @param {import('@/modules/core/helpers/userHelper').UserRecord | undefined} targetUser
 * @param {string | null} resourceName
 * @returns {Promise<{to: string, subject: string, text: string, html: string}>}
 */
async function buildEmailContents(invite, inviter, targetUser, resourceName) {
  const email = targetUser ? targetUser.email : invite.target
  const serverInfo = await getServerInfo()
  const inviteLink = buildInviteLink(invite)

  const bodyText = buildEmailTextBody(
    invite,
    inviter,
    serverInfo,
    inviteLink,
    resourceName
  )
  const bodyHtml = buildEmailHtmlBody(
    invite,
    inviter,
    serverInfo,
    inviteLink,
    resourceName
  )
  const subject = buildEmailSubject(invite, inviter, resourceName)

  return {
    to: email,
    subject,
    text: bodyText,
    html: bodyHtml
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

  // if target user found, always use the user ID
  if (targetUser) target = buildUserTarget(targetUser.id)

  // validate inputs
  await validateInput(params, inviter, targetUser)
  const resourceName = await validateAndResolveResourceName(params)

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
    role
  }
  await insertInviteAndDeleteOld(
    invite,
    targetUser ? [targetUser.email, buildUserTarget(targetUser.id)] : []
  )

  // generate and send email
  const emailParams = await buildEmailContents(
    invite,
    inviter,
    targetUser,
    resourceName
  )
  await sendEmail(emailParams)

  return invite.id
}

/**
 * Re-send existing invite email
 * @param {import('@/modules/serverinvites/repositories').ServerInviteRecord} invite
 */
async function resendInviteEmail(invite) {
  const { inviterId, target } = invite

  const [inviter, targetUser, resourceName] = await Promise.all([
    getUser(inviterId),
    getUserFromTarget(target),
    validateAndResolveResourceName(invite)
  ])

  const emailParams = await buildEmailContents(
    invite,
    inviter,
    targetUser,
    resourceName
  )
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
