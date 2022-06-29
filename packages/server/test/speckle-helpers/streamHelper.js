const { StreamAcl } = require('@/modules/core/dbSchema')

/**
 * Get the role user has for the specified stream
 * @param {string} userId
 * @param {string} streamId
 * @returns {Promise<string>}
 */
async function getUserStreamRole(userId, streamId) {
  const entry = await StreamAcl.knex()
    .where({
      [StreamAcl.col.resourceId]: streamId,
      [StreamAcl.col.userId]: userId
    })
    .first()

  return entry?.role || null
}

module.exports = {
  getUserStreamRole
}
