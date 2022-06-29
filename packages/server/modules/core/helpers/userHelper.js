const { pick } = require('lodash')

/**
 * @typedef {{
 *  id: string,
 *  suuid: string,
 *  createdAt?: Date,
 *  name: string,
 *  bio?: string,
 *  company?: string,
 *  email: string,
 *  verified: boolean,
 *  avatar: string,
 *  profiles?: string,
 *  passwordDigest: string,
 *  ip?: string,
 * }} UserRecord
 */

/**
 * Fields from the entity that users can see about other users
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
 * @typedef {Pick<
 *  UserRecord,
 *  'id' | 'name' | 'bio' | 'company' | 'verified' | 'avatar' | 'createdAt'
 * >} LimitedUserRecord
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
