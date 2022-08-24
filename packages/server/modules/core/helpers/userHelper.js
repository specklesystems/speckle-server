const { pick } = require('lodash')

/**
 * @typedef {import('@/modules/core/helpers/types').UserRecord} UserRecord
 */

/**
 * Fields from the entity that users can see about other users
 */

/**
 * @type {Array<keyof import('@/modules/core/helpers/types').LimitedUserRecord>}
 */
const LIMITED_USER_FIELDS = [
  'id',
  'name',
  'bio',
  'company',
  'verified',
  'avatar',
  'createdAt'
]

/**
 * @typedef {import('@/modules/core/helpers/types').LimitedUserRecord} LimitedUserRecord
 */

/**
 * Remove fields from user that other users should not see/know about
 * @param {UserRecord} user
 * @returns {LimitedUserRecord}
 */
function removePrivateFields(user) {
  if (!user) return user
  return pick(user, LIMITED_USER_FIELDS)
}

module.exports = {
  LIMITED_USER_FIELDS,
  removePrivateFields
}
