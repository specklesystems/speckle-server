'use strict'
const knex = require('@/db/knex')
const { Users: UsersSchema, UserEmails } = require('@/modules/core/dbSchema')

const Users = () => UsersSchema.knex()

const { LIMITED_USER_FIELDS } = require('@/modules/core/helpers/userHelper')
const { omit } = require('lodash')
const { Roles } = require('@speckle/shared')

module.exports = {
  /**
   * User search available for normal server users. It's more limited because of the lower access level.
   */
  async searchUsers(searchQuery, limit, cursor, archived = false, emailOnly = false) {
    const prefixedLimitedUserFields = LIMITED_USER_FIELDS.map(
      (field) => `users.${field}`
    )
    const query = Users()
      .join('server_acl', 'users.id', 'server_acl.userId')
      .leftJoin(UserEmails.name, UserEmails.col.userId, UsersSchema.col.id)
      .columns([
        ...Object.values(omit(UsersSchema.col, ['email', 'verified'])).filter((col) =>
          prefixedLimitedUserFields.includes(col)
        ),
        knex.raw(`(array_agg("user_emails"."verified"))[1] as verified`)
      ])
      .groupBy(UsersSchema.col.id)
      .where((queryBuilder) => {
        queryBuilder.where({ [UserEmails.col.email]: searchQuery }) //match full email or partial name
        if (!emailOnly) queryBuilder.orWhere('name', 'ILIKE', `%${searchQuery}%`)
        if (!archived) queryBuilder.andWhere('role', '!=', Roles.Server.ArchivedUser)
      })

    if (cursor) query.andWhere('users.createdAt', '<', cursor)

    const defaultLimit = 25
    query.orderBy('users.createdAt', 'desc').limit(limit || defaultLimit)

    const rows = await query
    return {
      users: rows,
      cursor: rows.length > 0 ? rows[rows.length - 1].createdAt.toISOString() : null
    }
  }
}
