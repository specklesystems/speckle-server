const { Users } = require('@/modules/core/dbSchema')
const { isArray } = require('lodash')

/**
 * @param {import('@/modules/core/helpers/userHelper').UserRecord | null} user
 */
function sanitizeUserRecord(user) {
  if (!user) return
  delete user.passwordDigest
  return user
}

/**
 * Get users by ID
 * @param {string|string[]} userIds
 * @returns {Promise<import("@/modules/core/helpers/userHelper").UserRecord[]>}
 */
async function getUsers(userIds) {
  userIds = isArray(userIds) ? userIds : [userIds]

  const q = Users.knex().whereIn(Users.col.id, userIds)
  const users = await q
  return users.map(sanitizeUserRecord)
}

/**
 * Get user by ID
 * @param {string} userId
 * @returns {Promise<import("@/modules/core/helpers/userHelper").UserRecord | null>}
 */
async function getUser(userId) {
  if (!userId) return null
  const users = await getUsers([userId])
  return users?.[0] || null
}

/**
 * Get user by e-mail address
 * @param {string} email
 * @returns {Promise<import('@/modules/core/helpers/userHelper').UserRecord | null>}
 */
async function getUserByEmail(email) {
  const q = Users.knex().whereRaw('lower(email) = lower(?)', [email])
  const user = await q.first()
  return user ? sanitizeUserRecord(user) : null
}

module.exports = {
  getUsers,
  getUser,
  getUserByEmail
}
