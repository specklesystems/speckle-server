const { ServerInvites } = require('@/modules/core/dbSchema')
const { getUserByEmail, getUser } = require('@/modules/core/repositories/users')
const { ResourceNotResolvableError } = require('@/modules/serverinvites/errors')
const {
  resolveTarget,
  ResourceTargets,
  buildUserTarget,
  isServerInvite
} = require('@/modules/serverinvites/helpers/inviteHelper')
const { uniq, isArray } = require('lodash')
const { getStream } = require('@/modules/core/repositories/streams')

/**
 * @typedef {{
 *  id: string,
 *  target: string,
 *  inviterId: string,
 *  createdAt?: Date,
 *  used?: boolean,
 *  message?: string,
 *  resourceTarget?: string,
 *  resourceId?: string,
 *  role?: string,
 *  token: string
 * }} ServerInviteRecord
 */

/**
 * Resolve resource from invite
 * @param {import('@/modules/serverinvites/helpers/inviteHelper').InviteResourceData} invite
 * @returns {Promise<Object>}
 */
async function getResource(invite) {
  if (isServerInvite(invite)) return null

  const { resourceId, resourceTarget } = invite
  if (resourceTarget === ResourceTargets.Streams) {
    return await getStream({ streamId: resourceId })
  } else {
    throw new ResourceNotResolvableError('Unexpected invite resource type')
  }
}

/**
 * Try to find a user using the target value
 * @param {string} target
 * @returns {Promise<import('@/modules/core/helpers/userHelper').UserRecord>}
 */
async function getUserFromTarget(target) {
  const { userEmail, userId } = resolveTarget(target)
  return userEmail ? await getUserByEmail(userEmail) : await getUser(userId)
}

/**
 * Insert a new invite and delete the old ones
 * @param {ServerInviteRecord} invite
 * @param {string[]} alternateTargets If there are alternate targets for the same user
 * (e.g. user ID & email), you can specify them to ensure those will be cleaned up
 * also
 */
async function insertInviteAndDeleteOld(invite, alternateTargets = []) {
  const allTargets = uniq(
    [invite.target, ...alternateTargets].map((t) => t.toLowerCase())
  )

  // Delete old
  await ServerInvites.knex()
    .where({
      [ServerInvites.col.resourceId]: invite.resourceId || null,
      [ServerInvites.col.resourceTarget]: invite.resourceTarget || null
    })
    .whereIn(ServerInvites.col.target, allTargets)
    .delete()

  // Insert new
  invite.target = invite.target.toLowerCase() // Extra safety cause our schema is case sensitive
  await ServerInvites.knex().insert(invite)
}

/**
 * Retrieve a valid server invite for the specified target
 * @param {string} email Email address
 * @param {string|undefined} token Specify an invite token, if you're looking for
 * a specific invite. For backwards compatibility purposes, the token can also just be the invite ID.
 * @returns {ServerInviteRecord | null}
 */
async function getServerInvite(email, token = undefined) {
  if (!email) return null

  const q = ServerInvites.knex().where({
    [ServerInvites.col.target]: email.toLowerCase()
  })

  if (token) {
    q.andWhere(ServerInvites.col.token, token)
  }

  return await q.first()
}

/**
 * Use up/delete all server-only for the specified email
 * @param {string} email
 */
async function deleteServerOnlyInvites(email) {
  if (!email) return

  await ServerInvites.knex()
    .where({
      [ServerInvites.col.target]: email.toLowerCase(),
      [ServerInvites.col.resourceTarget]: null
    })
    .delete()
}

/**
 * Update all invites that have the specified targets to have a new target value
 * @param {string[]|string} oldTargets A single target or an array of targets
 * @param {string} newTarget
 * @returns
 */
async function updateAllInviteTargets(oldTargets, newTarget) {
  if (!oldTargets || !newTarget) return
  oldTargets = isArray(oldTargets) ? oldTargets : [oldTargets]
  oldTargets = oldTargets.map((t) => t.toLowerCase())
  if (!oldTargets.length) return

  // PostgreSQL doesn't support aliases in update calls for some reason...
  await ServerInvites.knex()
    .whereIn(ServerInvites.col.target, oldTargets)
    .update('target', newTarget.toLowerCase())
}

/**
 * Get all pending stream invites
 * @param {string} streamId
 * @returns {ServerInviteRecord[]}
 */
async function getAllStreamInvites(streamId) {
  if (!streamId) return []

  const q = ServerInvites.knex().where({
    [ServerInvites.col.resourceTarget]: ResourceTargets.Streams,
    [ServerInvites.col.resourceId]: streamId
  })

  return await q
}

/**
 * Get all invitations to streams that the specified user has
 * @param {string} userId
 * @returns {Promise<ServerInviteRecord[]>}
 */
async function getAllUserStreamInvites(userId) {
  if (!userId) return []
  const target = buildUserTarget(userId)

  const q = ServerInvites.knex().where({
    [ServerInvites.col.target]: target,
    [ServerInvites.col.resourceTarget]: ResourceTargets.Streams
  })

  return await q
}

/**
 * Retrieve a stream invite for the specified target, token or both.
 * Note: Either the target, inviteId or token must be set
 * @param {string} streamId
 * @param {string|null} target
 * @param {string|null} token
 * @param {string|null} inviteId
 * @returns {Promise<ServerInviteRecord | null>}
 */
async function getStreamInvite(
  streamId,
  { target = null, token = null, inviteId = null } = {}
) {
  if (!target && !token && !inviteId) return null

  const q = ServerInvites.knex().where({
    [ServerInvites.col.resourceTarget]: ResourceTargets.Streams,
    [ServerInvites.col.resourceId]: streamId
  })

  if (target) {
    q.andWhere({
      [ServerInvites.col.target]: target.toLowerCase()
    })
  } else if (inviteId) {
    q.andWhere({
      [ServerInvites.col.id]: inviteId
    })
  } else if (token) {
    q.andWhere({
      [ServerInvites.col.token]: token
    })
  }

  return await q.first()
}

/**
 * Delete a single stream invite
 * @param {string} inviteId
 */
async function deleteStreamInvite(inviteId) {
  if (!inviteId) return

  await ServerInvites.knex()
    .where({
      [ServerInvites.col.id]: inviteId,
      [ServerInvites.col.resourceTarget]: ResourceTargets.Streams
    })
    .delete()
}

function findServerInvitesBaseQuery(searchQuery) {
  const q = ServerInvites.knex()

  if (searchQuery) {
    // TODO: Is this safe from SQL injection?
    q.andWhere(ServerInvites.col.target, 'ILIKE', `%${searchQuery}%`)
  }

  // Not an invite for an already registered user
  q.andWhere(ServerInvites.col.target, 'NOT ILIKE', '@%')

  return q
}

/**
 * Count all server invites, optionally filtering out unnecessary ones with the search query
 * @param {string|null} searchQuery
 * @returns {Promise<number>}
 */
async function countServerInvites(searchQuery) {
  const q = findServerInvitesBaseQuery(searchQuery)
  const [count] = await q.count()
  return parseInt(count.count)
}

/**
 *
 * @param {string|null} searchQuery
 * @param {number} limit
 * @param {number} offset
 * @returns {Promise<ServerInviteRecord[]>}
 */
async function findServerInvites(searchQuery, limit, offset) {
  const q = findServerInvitesBaseQuery(searchQuery)
  q.limit(limit).offset(offset)

  return await q
}

/**
 * Retrieve a specific invite (irregardless of the type)
 * @param {string} inviteId
 * @returns {Promise<ServerInviteRecord | null>}
 */
async function getInvite(inviteId) {
  if (!inviteId) return null
  return await ServerInvites.knex().where(ServerInvites.col.id, inviteId).first()
}

/**
 * Delete a specific invite (irregardless of the type)
 * @param {string} inviteId
 * @returns {Promise<boolean>}
 */
async function deleteInvite(inviteId) {
  if (!inviteId) return false
  await ServerInvites.knex().where(ServerInvites.col.id, inviteId).delete()
  return true
}

/**
 * Delete invites by target - useful when there are potentially duplicate invites that need cleaning up
 * (e.g. same target, but multiple inviters)
 * @param {string|string[]} targets
 * @param {string} resourceTarget
 * @param {string} resourceId
 * @returns
 */
async function deleteInvitesByTarget(targets, resourceTarget, resourceId) {
  if (!targets) return false
  targets = isArray(targets) ? targets : [targets]
  if (!targets.length) return

  resourceTarget = resourceTarget || null
  resourceId = resourceId || null

  await ServerInvites.knex()
    .where({
      [ServerInvites.col.resourceTarget]: resourceTarget,
      [ServerInvites.col.resourceId]: resourceId
    })
    .whereIn(ServerInvites.col.target, targets)
    .delete()

  return true
}

/**
 * Delete all invites that target the specified user
 * @param {string} userId
 * @returns {Promise<boolean>}
 */
async function deleteAllUserInvites(userId) {
  if (!userId) return false
  await ServerInvites.knex()
    .where(ServerInvites.col.target, buildUserTarget(userId))
    .delete()
  return true
}

/**
 * Get all invites by IDs
 * @returns {Promise<ServerInviteRecord[]>}
 */
async function getInvites(inviteIds) {
  if (!inviteIds?.length) return []
  return await ServerInvites.knex().whereIn(ServerInvites.col.id, inviteIds)
}

module.exports = {
  insertInviteAndDeleteOld,
  getServerInvite,
  deleteServerOnlyInvites,
  getUserFromTarget,
  updateAllInviteTargets,
  getStreamInvite,
  deleteStreamInvite,
  getAllStreamInvites,
  countServerInvites,
  findServerInvites,
  getInvite,
  deleteInvite,
  deleteInvitesByTarget,
  deleteAllUserInvites,
  getResource,
  getAllUserStreamInvites,
  getInvites
}
