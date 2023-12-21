import { pick } from 'lodash'
import { LimitedUserRecord, UserRecord } from '@/modules/core/helpers/types'
import { Nullable } from '@speckle/shared'

/**
 * @typedef {import('@/modules/core/helpers/types').UserRecord} UserRecord
 */

/**
 * Fields from the entity that users can see about other users
 */

/**
 * @type {Array<keyof import('@/modules/core/helpers/types').LimitedUserRecord>}
 */
export const LIMITED_USER_FIELDS = [
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
 * @param {UserRecord|LimitedUserRecord} user
 * @returns {LimitedUserRecord}
 */
export function removePrivateFields(
  user: Nullable<UserRecord> | Nullable<LimitedUserRecord>
) {
  if (!user) return user
  return pick(user, LIMITED_USER_FIELDS)
}
