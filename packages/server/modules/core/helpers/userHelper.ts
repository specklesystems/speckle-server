import { LimitedUserRecord, UserRecord } from '@/modules/core/helpers/types'
import { Knex } from 'knex'
import { pick } from 'lodash'
import { UserEmails, Users } from '../dbSchema'

/**
 * Fields from the entity that users can see about other users
 */
export const LIMITED_USER_FIELDS: Array<keyof LimitedUserRecord> = [
  'id',
  'name',
  'bio',
  'company',
  'avatar',
  'createdAt'
]

/**
 * Remove fields from user that other users should not see/know about
 */
export function removePrivateFields(
  user: UserRecord | LimitedUserRecord
): LimitedUserRecord {
  if (!user) return user
  return pick(user, LIMITED_USER_FIELDS)
}

export type { LimitedUserRecord, UserRecord }

export const getUsersBaseQuery = (
  query: Knex.QueryBuilder,
  { searchQuery, role }: { searchQuery: string | null; role: string | null }
) => {
  if (searchQuery) {
    query.where((queryBuilder) => {
      queryBuilder
        .where((qb) => {
          qb.where(UserEmails.col.email, 'ILIKE', `%${searchQuery}%`).where({
            primary: true
          })
        })
        .orWhere(Users.col.name, 'ILIKE', `%${searchQuery}%`)
        .orWhere(Users.col.company, 'ILIKE', `%${searchQuery}%`)
    })
  }
  if (role) query.where({ role })
  return query
}
