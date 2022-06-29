const { ServerInvites } = require('@/modules/core/dbSchema')
const { getUserByEmail, getUser } = require('@/modules/core/repositories/users')
const {
  resolveTarget,
  ResourceTargets
} = require('@/modules/serverinvites/helpers/inviteHelper')
const { uniq, isArray } = require('lodash')

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
 *  role?: string
 * }} ServerInviteRecord
 */

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
 * @param {string|undefined} inviteId Specify an invite ID, if you're looking for
 * a specific invite
 * @returns {ServerInviteRecord | null}
 */
async function getServerInvite(email, inviteId = undefined) {
  if (!email) return null

  const q = ServerInvites.knex().where({
    [ServerInvites.col.target]: email.toLowerCase()
  })

  if (inviteId) {
    q.andWhere(ServerInvites.col.id, inviteId)
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
 * Retrieve a stream invite for the specified target, inviteId or both.
 * Note: Either the target or inviteId must be set
 * @param {string} streamId
 * @param {string|null} target
 * @param {string|null} inviteId
 * @returns {ServerInviteRecord | null}
 */
async function getStreamInvite(streamId, target = null, inviteId = null) {
  if (!target && !inviteId) return null

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
  deleteInvite
}
