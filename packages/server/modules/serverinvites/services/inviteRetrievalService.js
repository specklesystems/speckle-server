const { removePrivateFields } = require('@/modules/core/helpers/userHelper')
const { getUsers, getUser } = require('@/modules/core/repositories/users')
const { NoInviteFoundError } = require('@/modules/serverinvites/errors')
const {
  resolveTarget,
  resolveInviteTargetTitle,
  buildUserTarget
} = require('@/modules/serverinvites/helpers/inviteHelper')
const {
  getAllStreamInvites,
  getStreamInvite,
  getAllUserStreamInvites
} = require('@/modules/serverinvites/repositories')
const { keyBy, uniq } = require('lodash')

/**
 * The token field is intentionally ommited from this and only managed through the .token resolver
 * for extra security - so that no one accidentally returns it out from this service
 *
 * @typedef {{
 *  id: string,
 *  inviteId: string,
 *  streamId: string,
 *  title: string,
 *  role: string,
 *  invitedById: string,
 *  user: import('@/modules/core/helpers/userHelper').LimitedUserRecord | null,
 * }} PendingStreamCollaboratorGraphQLType
 */

/**
 * @param {import('@/modules/serverinvites/helpers/types').ServerInviteRecord} invite
 * @returns {string}
 */
function buildPendingStreamCollaboratorId(invite) {
  return `invite:${invite.id}`
}

/**
 * @param {import('@/modules/serverinvites/helpers/types').ServerInviteRecord} invite
 * @param {import('@/modules/core/helpers/userHelper').UserRecord | null} targetUser
 * @returns {PendingStreamCollaboratorGraphQLType}
 */
function buildPendingStreamCollaboratorModel(invite, targetUser) {
  const { resourceId } = invite

  return {
    id: buildPendingStreamCollaboratorId(invite),
    inviteId: invite.id,
    streamId: resourceId,
    title: resolveInviteTargetTitle(invite, targetUser),
    role: invite.role,
    invitedById: invite.inviterId,
    user: targetUser
  }
}

/**
 * Get all registered invitation target users keyed by their ID
 * @param {import("@/modules/serverinvites/repositories").ServerInviteRecord[]} invites
 * @returns {Object<string, import("@/modules/core/helpers/userHelper").UserRecord>}
 */
async function getInvitationTargetUsers(invites) {
  const userIds = uniq(
    invites.map((i) => resolveTarget(i.target).userId).filter((id) => !!id)
  )
  if (!userIds.length) return {}

  const users = await getUsers(userIds)
  return keyBy(users, 'id')
}

/**
 * Get pending stream collaborators (invited, but not accepted)
 * @param {string} streamId
 * @returns {Promise<PendingStreamCollaboratorGraphQLType[]>}
 */
async function getPendingStreamCollaborators(streamId) {
  // Get all pending invites
  const invites = await getAllStreamInvites(streamId)

  // Get all target users, if any
  const usersById = await getInvitationTargetUsers(invites)

  // Build results
  const results = []
  for (const invite of invites) {
    /** @type {import("@/modules/core/helpers/userHelper").LimitedUserRecord} */
    let user
    const { userId } = resolveTarget(invite.target)
    if (userId && usersById[userId]) {
      user = removePrivateFields(usersById[userId])
    }

    results.push(buildPendingStreamCollaboratorModel(invite, user))
  }

  return results
}

/**
 * Find a pending invitation to the specified stream for the specified user
 * Either the user ID or invite ID must be set
 * @param {string} streamId
 * @param {string|null} userId
 * @param {string|null} token
 * @returns {Promise<PendingStreamCollaboratorGraphQLType>}
 */
async function getUserPendingStreamInvite(streamId, userId, token) {
  if (!userId && !token) return null

  const invite = await getStreamInvite(streamId, {
    target: buildUserTarget(userId),
    token
  })
  if (!invite) return null

  const targetUser = userId ? await getUser(userId) : null

  return buildPendingStreamCollaboratorModel(invite, targetUser)
}

/**
 * Get all pending invitations to streams that this user has
 * @param {string} userId
 * @returns {Promise<PendingStreamCollaboratorGraphQLType[]>}
 */
async function getUserPendingStreamInvites(userId) {
  if (!userId) return []

  const targetUser = await getUser(userId)
  if (!targetUser) {
    throw new NoInviteFoundError('Nonexistant user specified')
  }

  const invites = await getAllUserStreamInvites(userId)
  return invites.map((i) => buildPendingStreamCollaboratorModel(i, targetUser))
}

module.exports = {
  getPendingStreamCollaborators,
  getUserPendingStreamInvite,
  getUserPendingStreamInvites
}
