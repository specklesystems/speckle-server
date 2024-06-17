const { ServerInvites, Streams, knex } = require('@/modules/core/dbSchema')
const {
  ResourceTargets,
  buildUserTarget
} = require('@/modules/serverinvites/helpers/inviteHelper')
const { isArray } = require('lodash')

/**
 * Use this wherever you're retrieving invites, not necessarily where you're writing to them
 */
const getInvitesBaseQuery = (sort = 'asc') => {
  const q = ServerInvites.knex().select(ServerInvites.cols)

  // join just to ensure we don't retrieve invalid invites
  q.leftJoin(Streams.name, (j) => {
    j.onNotNull(ServerInvites.col.resourceId)
      .andOnVal(ServerInvites.col.resourceTarget, ResourceTargets.Streams)
      .andOn(Streams.col.id, ServerInvites.col.resourceId)
  }).where((w1) => {
    w1.whereNull(ServerInvites.col.resourceId).orWhereNotNull(Streams.col.id)
  })

  q.orderBy(ServerInvites.col.createdAt, sort)

  return q
}

/**
 * Retrieve a valid server invite for the specified target
 * @param {string|undefined} email Email address
 * @param {string|undefined} token Specify an invite token, if you're looking for
 * a specific invite. For backwards compatibility purposes, the token can also just be the invite ID.
 * @returns {import('@/modules/serverinvites/helpers/types').ServerInviteRecord | null}
 */

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
  const ServerInvitesCols = ServerInvites.with({ withoutTablePrefix: true }).col
  await ServerInvites.knex()
    .whereIn(ServerInvitesCols.target, oldTargets)
    .update(ServerInvitesCols.target, newTarget.toLowerCase())
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

function findServerInvitesBaseQuery(searchQuery, sort) {
  const q = getInvitesBaseQuery(sort)

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
  const [count] = await knex().count().from(q.as('sq1'))
  return parseInt(count.count)
}

/**
 *
 * @param {string|null} searchQuery
 * @param {number} limit
 * @param {number} offset
 * @returns {Promise<import('@/modules/serverinvites/helpers/types').ServerInviteRecord[]>}
 */
async function findServerInvites(searchQuery, limit, offset) {
  const q = findServerInvitesBaseQuery(searchQuery)
  q.limit(limit).offset(offset)

  return await q
}

/**
 *
 * @param {string|null} searchQuery
 * @param {number} limit
 * @param {Date|null} cursor
 * @returns {Promise<import('@/modules/serverinvites/helpers/types').ServerInviteRecord[]>}
 */
async function queryServerInvites(searchQuery, limit, cursor) {
  const q = findServerInvitesBaseQuery(searchQuery, 'desc').limit(limit)

  if (cursor) q.where(ServerInvites.col.createdAt, '<', cursor.toISOString())
  return await q
}

/**
 * Retrieve a specific invite (irregardless of the type)
 * @param {string} inviteId
 * @returns {Promise<import('@/modules/serverinvites/helpers/types').ServerInviteRecord | null>}
 */
async function getInvite(inviteId) {
  if (!inviteId) return null
  return await getInvitesBaseQuery().where(ServerInvites.col.id, inviteId).first()
}

/**
 * Retrieve a specific invite (irregardless of the type) by the token
 * @param {string} inviteId
 * @returns {Promise<import('@/modules/serverinvites/helpers/types').ServerInviteRecord | null>}
 */
async function getInviteByToken(inviteToken) {
  if (!inviteToken) return null
  return await getInvitesBaseQuery().where(ServerInvites.col.token, inviteToken).first()
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
 * @returns {Promise<import('@/modules/serverinvites/helpers/types').ServerInviteRecord[]>}
 */
async function getInvites(inviteIds) {
  if (!inviteIds?.length) return []
  return await getInvitesBaseQuery().whereIn(ServerInvites.col.id, inviteIds)
}

module.exports = {
  deleteServerOnlyInvites,
  updateAllInviteTargets,
  deleteStreamInvite,
  countServerInvites,
  findServerInvites,
  getInvite,
  deleteInvite,
  deleteInvitesByTarget,
  deleteAllUserInvites,
  getInvites,
  getInviteByToken,
  queryServerInvites
}
