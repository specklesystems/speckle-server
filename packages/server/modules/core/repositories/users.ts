import { ServerAcl, UserEmails, Users, knex } from '@/modules/core/dbSchema'
import { ServerAclRecord, UserRecord, UserWithRole } from '@/modules/core/helpers/types'
import { Nullable } from '@/modules/shared/helpers/typeHelper'
import { clamp, isArray, omit } from 'lodash'
import { metaHelpers } from '@/modules/core/helpers/meta'
import { UserValidationError } from '@/modules/core/errors/user'
import { Knex } from 'knex'
import { Roles, ServerRoles } from '@speckle/shared'
import { updateUserEmailFactory } from '@/modules/core/repositories/userEmails'
import { markUserEmailAsVerifiedFactory } from '@/modules/core/services/users/emailVerification'
import { UserWithOptionalRole } from '@/modules/core/domain/users/types'
import {
  CountAdminUsers,
  CountUsers,
  DeleteUserRecord,
  GetFirstAdmin,
  GetUser,
  GetUserByEmail,
  GetUserParams,
  GetUserRole,
  GetUsers,
  IsLastAdminUser,
  LegacyGetPaginatedUsers,
  LegacyGetPaginatedUsersCount,
  LegacyGetUser,
  LegacyGetUserByEmail,
  ListPaginatedUsersPage,
  MarkOnboardingComplete,
  MarkUserAsVerified,
  SearchLimitedUsers,
  StoreUser,
  StoreUserAcl,
  UpdateUser,
  UpdateUserServerRole
} from '@/modules/core/domain/users/operations'
import { LIMITED_USER_FIELDS } from '@/modules/core/helpers/userHelper'
export type { UserWithOptionalRole, GetUserParams }

const tables = {
  users: (db: Knex) => db<UserRecord>(Users.name),
  serverAcl: (db: Knex) => db<ServerAclRecord>(ServerAcl.name)
}

function sanitizeUserRecord<T extends Nullable<UserRecord>>(user: T): T {
  if (!user) return user
  delete user.passwordDigest
  return user
}

const getUsersBaseQuery = (
  query: Knex.QueryBuilder,
  { searchQuery, role }: { searchQuery: string | null; role?: string | null }
) => {
  if (searchQuery) {
    query.where((queryBuilder) => {
      queryBuilder
        .where((qb) => {
          qb.where(UserEmails.col.email, 'ILIKE', `%${searchQuery}%`).where({
            [UserEmails.col.primary]: true
          })
        })
        .orWhere(Users.col.name, 'ILIKE', `%${searchQuery}%`)
        .orWhere(Users.col.company, 'ILIKE', `%${searchQuery}%`)
    })
  }
  if (role) query.where({ role })
  return query
}

/**
 * Get users by ID
 */
export const getUsersFactory =
  (deps: { db: Knex }): GetUsers =>
  async (
    userIds: string | string[],
    params?: GetUserParams
  ): Promise<UserWithOptionalRole[]> => {
    const { withRole, skipClean } = params || {}
    userIds = isArray(userIds) ? userIds : [userIds]

    const q = tables.users(deps.db).whereIn(Users.col.id, userIds)
    q.leftJoin(UserEmails.name, UserEmails.col.userId, Users.col.id).where({
      [UserEmails.col.primary]: true
    })

    const columns: (Knex.Raw<UserRecord> | string)[] = [
      ...Object.values(omit(Users.col, ['email', 'verified'])),
      knex.raw(`(array_agg("user_emails"."email"))[1] as email`),
      knex.raw(`(array_agg("user_emails"."verified"))[1] as verified`)
    ]
    if (withRole) {
      // Getting first role from grouped results
      columns.push(knex.raw(`(array_agg("server_acl"."role"))[1] as role`))
      q.leftJoin(ServerAcl.name, ServerAcl.col.userId, Users.col.id)
    }

    q.columns<UserWithOptionalRole[]>(columns)
    q.groupBy(Users.col.id)

    return (await q).map((u) => (skipClean ? u : sanitizeUserRecord(u)))
  }

/**
 * List users
 */
export const listUsersFactory =
  (deps: { db: Knex }): ListPaginatedUsersPage =>
  async ({ limit, cursor, query, role }) => {
    const sanitizedLimit = clamp(limit, 1, 200)

    const userCols = omit(Users.col, ['email', 'verified'])
    const q = tables
      .users(deps.db)
      .orderBy(Users.col.createdAt, 'desc')
      .limit(sanitizedLimit)
      .columns([
        ...Object.values(userCols),
        // Getting first role from grouped results
        knex.raw(`(array_agg("server_acl"."role"))[1] as role`),
        knex.raw(`(array_agg("user_emails"."email"))[1] as email`),
        knex.raw(`(array_agg("user_emails"."verified"))[1] as verified`)
      ])
      .leftJoin(ServerAcl.name, ServerAcl.col.userId, Users.col.id)
      .leftJoin(UserEmails.name, UserEmails.col.userId, Users.col.id)
      .where({ [UserEmails.col.primary]: true })
      .groupBy(Users.col.id)
    if (cursor) q.where(Users.col.createdAt, '<', cursor)
    const users: UserWithRole[] = await getUsersBaseQuery(q, {
      searchQuery: query,
      role
    })
    return users.map((u) => sanitizeUserRecord(u))
  }

export const countUsersFactory =
  (deps: { db: Knex }): CountUsers =>
  async (args) => {
    const q = tables
      .users(deps.db)
      .leftJoin(ServerAcl.name, ServerAcl.col.userId, Users.col.id)
      .leftJoin(UserEmails.name, UserEmails.col.userId, Users.col.id)
      .countDistinct(Users.col.id)

    const result = await getUsersBaseQuery(q, {
      searchQuery: args.query,
      role: args.role
    })
    return parseInt(result[0]['count'])
  }

/**
 * Get user by ID
 */
export const getUserFactory =
  (deps: { db: Knex }): GetUser =>
  async (userId: string, params?: GetUserParams) => {
    if (!userId) return null
    const users = await getUsersFactory(deps)([userId], params)
    return users?.[0] || null
  }

/**
 * Get user by e-mail address
 */
export const getUserByEmailFactory =
  (deps: { db: Knex }): GetUserByEmail =>
  async (
    email: string,
    options?: Partial<{ skipClean: boolean; withRole: boolean }>
  ) => {
    const q = tables
      .users(deps.db)
      .leftJoin(UserEmails.name, UserEmails.col.userId, Users.col.id)
      .where({
        [UserEmails.col.primary]: true
      })
      .whereRaw('lower("user_emails"."email") = lower(?)', [email])
    const columns: (Knex.Raw<UserRecord> | string)[] = [
      ...Object.values(omit(Users.col, ['email', 'verified'])),
      knex.raw(`(array_agg("user_emails"."email"))[1] as email`),
      knex.raw(`(array_agg("user_emails"."verified"))[1] as verified`)
    ]
    if (options?.withRole) {
      // Getting first role from grouped results
      columns.push(knex.raw(`(array_agg("server_acl"."role"))[1] as role`))
      q.leftJoin(ServerAcl.name, ServerAcl.col.userId, Users.col.id)
    }
    q.columns(columns)
    q.groupBy(Users.col.id)

    const user = (await q.first()) as UserWithOptionalRole
    return user ? (!options?.skipClean ? sanitizeUserRecord(user) : user) : null
  }

/**
 * Mark a user as verified by e-mail address, and return true on success
 */
export const markUserAsVerifiedFactory =
  (deps: { db: Knex }): MarkUserAsVerified =>
  async (email: string) => {
    const UserCols = Users.with({ withoutTablePrefix: true }).col

    const usersUpdate = await tables
      .users(deps.db)
      .whereRaw('lower(email) = lower(?)', [email])
      .update({
        [UserCols.verified]: true
      })

    const userEmailsUpdate = await markUserEmailAsVerifiedFactory({
      updateUserEmail: updateUserEmailFactory({ db: deps.db })
    })({ email: email.toLowerCase().trim() })

    return !!(usersUpdate || userEmailsUpdate)
  }

export const markOnboardingCompleteFactory =
  (deps: { db: Knex }): MarkOnboardingComplete =>
  async (userId: string) => {
    if (!userId) return false

    const meta = metaHelpers(Users, deps.db)
    const newMeta = await meta.set(userId, 'isOnboardingFinished', true)

    return !!newMeta.value
  }

const cleanInputRecord = (
  update: Partial<UserRecord & { password?: string }>
): Partial<UserRecord> => {
  delete update.id
  delete update.passwordDigest
  delete update.password
  delete update.email
  return update
}

const validateInputRecord = (input: Partial<UserRecord>) => {
  if ((input.avatar?.length || 0) > 524288) {
    throw new UserValidationError('User avatar is too big, please try a smaller one')
  }

  if (!Object.values(input).length) {
    throw new UserValidationError('User update payload empty')
  }
}

export const updateUserFactory =
  (deps: { db: Knex }): UpdateUser =>
  async (
    userId: string,
    update: Partial<UserRecord>,
    options?: Partial<{
      skipClean: boolean
    }>
  ) => {
    if (!options?.skipClean) {
      update = cleanInputRecord(update)
    }
    validateInputRecord(update)

    const [newUser] = await tables
      .users(deps.db)
      .where(Users.col.id, userId)
      .update(update, '*')

    if (update.email) {
      await updateUserEmailFactory(deps)({
        query: { userId, primary: true },
        update: { email: update.email }
      })
    }

    return newUser as Nullable<UserRecord>
  }

export const getFirstAdminFactory =
  (deps: { db: Knex }): GetFirstAdmin =>
  async () => {
    const q = tables
      .users(deps.db)
      .select<UserRecord[]>(Users.cols)
      .innerJoin(ServerAcl.name, ServerAcl.col.userId, Users.col.id)
      .where(ServerAcl.col.role, Roles.Server.Admin)

    return await q.first()
  }

/**
 * @deprecated Use getUser instead
 */
export const legacyGetUserFactory =
  (deps: { db: Knex }): LegacyGetUser =>
  async (id) => {
    const user = await tables
      .users(deps.db)
      .where({ [Users.col.id]: id })
      .leftJoin(UserEmails.name, UserEmails.col.userId, Users.col.id)
      .where({ [UserEmails.col.primary]: true, [UserEmails.col.userId]: id })
      .columns<UserRecord>([
        ...Object.values(omit(Users.col, [Users.col.email, Users.col.verified])),
        knex.raw(`(array_agg("user_emails"."email"))[1] as email`),
        knex.raw(`(array_agg("user_emails"."verified"))[1] as verified`)
      ])
      .groupBy(Users.col.id)
      .first()
    if (user) delete user.passwordDigest
    return user!
  }

/**
 * Get all users or filter them with the specified searchQuery. This is meant for
 * server admins, because it exposes the User object (& thus the email).
 *
 * @deprecated Use listUsers instead
 */
export const legacyGetPaginatedUsersFactory =
  (deps: { db: Knex }): LegacyGetPaginatedUsers =>
  async (limit = 10, offset = 0, searchQuery = null) => {
    // sanitize limit
    const maxLimit = 200
    if (limit > maxLimit) limit = maxLimit

    const query = tables
      .users(deps.db)
      .leftJoin(UserEmails.name, UserEmails.col.userId, Users.col.id)
      .columns([
        ...Object.values(omit(Users.col, ['email', 'verified', 'passwordDigest'])),
        knex.raw(`(array_agg("user_emails"."email"))[1] as email`),
        knex.raw(`(array_agg("user_emails"."verified"))[1] as verified`)
      ])

    const res = await getUsersBaseQuery(query, { searchQuery })
      .groupBy(Users.col.id)
      .orderBy(Users.col.createdAt)
      .limit(limit)
      .offset(offset)

    return res as UserRecord[]
  }

/**
 * @deprecated Use countUsers instead
 */
export const legacyGetPaginatedUsersCountFactory =
  (deps: { db: Knex }): LegacyGetPaginatedUsersCount =>
  async (searchQuery = null) => {
    const query = tables
      .users(deps.db)
      .leftJoin(UserEmails.name, UserEmails.col.userId, Users.col.id)

    const [userCount] = await getUsersBaseQuery(query, { searchQuery }).count()
    return parseInt(userCount.count)
  }

/**
 * @deprecated Use getUserByEmail instead
 */
export const legacyGetUserByEmailFactory =
  (deps: { db: Knex }): LegacyGetUserByEmail =>
  async ({ email }) => {
    const user = await tables
      .users(deps.db)
      .leftJoin(UserEmails.name, UserEmails.col.userId, Users.col.id)
      .where({ [UserEmails.col.primary]: true })
      .whereRaw('lower("user_emails"."email") = lower(?)', [email])
      .columns<UserRecord>([
        ...Object.values(omit(Users.col, ['email', 'verified'])),
        knex.raw(`(array_agg("user_emails"."email"))[1] as email`),
        knex.raw(`(array_agg("user_emails"."verified"))[1] as verified`)
      ])
      .groupBy(Users.col.id)
      .first()
    if (!user) return null
    delete user.passwordDigest
    return user
  }

export const storeUserFactory =
  (deps: { db: Knex }): StoreUser =>
  async (params) => {
    const { user } = params
    const [newUser] = await tables.users(deps.db).insert(user, '*')
    return newUser
  }

export const countAdminUsersFactory =
  (deps: { db: Knex }): CountAdminUsers =>
  async () => {
    const [{ count }] = await tables
      .serverAcl(deps.db)
      .where({ role: Roles.Server.Admin })
      .count()

    return parseInt(count as string)
  }

export const isLastAdminUserFactory =
  (deps: { db: Knex }): IsLastAdminUser =>
  async (userId) => {
    if ((await countAdminUsersFactory(deps)()) === 1) {
      const currentAdmin = await tables
        .serverAcl(deps.db)
        .where({ role: Roles.Server.Admin })
        .first()
      if (currentAdmin && currentAdmin.userId === userId) {
        return true
      }
    }

    return false
  }

export const deleteUserRecordFactory =
  (deps: { db: Knex }): DeleteUserRecord =>
  async (id) => {
    const res = await tables.users(deps.db).where({ id }).del()
    return !!res
  }

export const storeUserAclFactory =
  (deps: { db: Knex }): StoreUserAcl =>
  async (params) => {
    const { acl } = params
    const [newAcl] = await tables.serverAcl(deps.db).insert(acl, '*')
    return newAcl
  }

export const updateUserServerRoleFactory =
  (deps: { db: Knex }): UpdateUserServerRole =>
  async (params) => {
    const { userId, role } = params
    const res = await tables.serverAcl(deps.db).where({ userId }).update({ role })
    return !!res
  }

export const getUserRoleFactory =
  (deps: { db: Knex }): GetUserRole =>
  async (id) => {
    const { role } = (await tables
      .serverAcl(deps.db)
      .where({ userId: id })
      .select('role')
      .first()) || {
      role: null
    }
    return role as Nullable<ServerRoles>
  }

/**
 * User search available for normal server users. It's more limited because of the lower access level.
 */
export const searchUsersFactory =
  (deps: { db: Knex }): SearchLimitedUsers =>
  async (searchQuery, limit, cursor, archived = false, emailOnly = false) => {
    const prefixedLimitedUserFields = LIMITED_USER_FIELDS.map(
      (field) => `users.${field}`
    )
    const query = tables
      .users(deps.db)
      .join('server_acl', 'users.id', 'server_acl.userId')
      .leftJoin(UserEmails.name, UserEmails.col.userId, Users.col.id)
      .columns([
        ...Object.values(omit(Users.col, ['email', 'verified'])).filter((col) =>
          prefixedLimitedUserFields.includes(col)
        ),
        knex.raw(`(array_agg("user_emails"."verified"))[1] as verified`)
      ])
      .groupBy(Users.col.id)
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
