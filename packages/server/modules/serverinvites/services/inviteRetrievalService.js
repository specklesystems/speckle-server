const { removePrivateFields } = require('@/modules/core/helpers/userHelper')
const { getUsers, getUser } = require('@/modules/core/repositories/users')
const {
  resolveTarget,
  resolveInviteTargetTitle,
  buildUserTarget
} = require('@/modules/serverinvites/helpers/inviteHelper')
const {
  getAllStreamInvites,
  getStreamInvite
} = require('@/modules/serverinvites/repositories')
const { keyBy, uniq } = require('lodash')

/**
 * @typedef {{
 *  id: string,
 *  inviteId: string,
 *  streamId: string,
 *  title: string,
 *  role: string,
 *  invitedById: string,
 *  user: import('@/modules/core/helpers/userHelper').LimitedUserRecord | null
 * }} PendingStreamCollaboratorGraphQLType
 */

/**
 * @param {import('@/modules/serverinvites/repositories').ServerInviteRecord} invite
 * @returns {string}
 */
function buildPendingStreamCollaboratorId(invite) {
  return `invite:${invite.id}`
}

/**
 * @param {string} streamId
 * @param {import('@/modules/serverinvites/repositories').ServerInviteRecord} invite
 * @param {import('@/modules/core/helpers/userHelper').UserRecord | null} targetUser
 * @returns {PendingStreamCollaboratorGraphQLType}
 */
function buildPendingStreamCollaboratorModel(streamId, invite, targetUser) {
  return {
    id: buildPendingStreamCollaboratorId(invite),
    inviteId: invite.id,
    streamId,
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

    results.push(buildPendingStreamCollaboratorModel(streamId, invite, user))
  }

  return results
}

/**
 * Resolve a stream invite as a PendingStreamCollaborator.
 * Either the user ID or invite ID must be set
 * @param {string} streamId
 * @param {string|null} userId
 * @param {string|null} inviteId
 * @returns {PendingStreamCollaboratorGraphQLType}
 */
async function getPendingStreamCollaborator(streamId, userId, inviteId) {
  if (!userId && !inviteId) return null

  const invite = await getStreamInvite(
    streamId,
    userId ? buildUserTarget(userId) : null,
    inviteId
  )
  if (!invite) return null

  const targetUser = userId ? await getUser(userId) : null

  return buildPendingStreamCollaboratorModel(streamId, invite, targetUser)
}

module.exports = {
  getPendingStreamCollaborators,
  getPendingStreamCollaborator
}
