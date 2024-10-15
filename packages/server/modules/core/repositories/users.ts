import { ServerAcl, UserEmails, Users, knex } from '@/modules/core/dbSchema'
import { ServerAclRecord, UserRecord, UserWithRole } from '@/modules/core/helpers/types'
import { Nullable } from '@/modules/shared/helpers/typeHelper'
import { clamp, isArray, omit } from 'lodash'
import { metaHelpers } from '@/modules/core/helpers/meta'
import { UserValidationError } from '@/modules/core/errors/user'
import { Knex } from 'knex'
import { Roles, ServerRoles } from '@speckle/shared'
import { updateUserEmailFactory } from '@/modules/core/repositories/userEmails'
import { db } from '@/db/knex'
import { markUserEmailAsVerifiedFactory } from '@/modules/core/services/users/emailVerification'
import { UserWithOptionalRole } from '@/modules/core/domain/users/types'
import {
  CountAdminUsers,
  GetUser,
  GetUserByEmail,
  GetUserParams,
  GetUsers,
  LegacyGetPaginatedUsers,
  LegacyGetPaginatedUsersCount,
  LegacyGetUser,
  StoreUser,
  StoreUserAcl
} from '@/modules/core/domain/users/operations'
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

type UserQuery = {
  query: string | null
  role?: ServerRoles | null
}

/**
 * List users
 */
export async function listUsers({
  limit,
  cursor,
  query,
  role
}: {
  limit: number
  cursor?: Date | null
} & UserQuery): Promise<UserWithRole[]> {
  const sanitizedLimit = clamp(limit, 1, 200)

  const userCols = omit(Users.col, ['email', 'verified'])
  const q = Users.knex<UserWithRole[]>()
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
  const users: UserWithRole[] = await getUsersBaseQuery(q, { searchQuery: query, role })
  return users.map((u) => sanitizeUserRecord(u))
}

export async function countUsers(args: UserQuery): Promise<number> {
  const q = Users.knex()
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
export async function markUserAsVerified(email: string) {
  const UserCols = Users.with({ withoutTablePrefix: true }).col

  const usersUpdate = await Users.knex()
    .whereRaw('lower(email) = lower(?)', [email])
    .update({
      [UserCols.verified]: true
    })

  const userEmailsUpdate = await markUserEmailAsVerifiedFactory({
    updateUserEmail: updateUserEmailFactory({ db })
  })({ email: email.toLowerCase().trim() })

  return !!(usersUpdate || userEmailsUpdate)
}

export async function markOnboardingComplete(userId: string) {
  if (!userId) return false

  const meta = metaHelpers(Users, db)
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

export async function updateUser(
  userId: string,
  update: Partial<UserRecord>,
  options?: Partial<{
    skipClean: boolean
  }>
) {
  if (!options?.skipClean) {
    update = cleanInputRecord(update)
  }
  validateInputRecord(update)

  const [newUser] = await Users.knex().where(Users.col.id, userId).update(update, '*')

  if (update.email) {
    await updateUserEmailFactory({ db })({
      query: { userId, primary: true },
      update: { email: update.email }
    })
  }

  return newUser as Nullable<UserRecord>
}

export async function getFirstAdmin() {
  const q = Users.knex()
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
export const legacyGetPaginatedUsersCount =
  (deps: { db: Knex }): LegacyGetPaginatedUsersCount =>
  async (searchQuery = null) => {
    const query = tables
      .users(deps.db)
      .leftJoin(UserEmails.name, UserEmails.col.userId, Users.col.id)

    const [userCount] = await getUsersBaseQuery(query, { searchQuery }).count()
    return parseInt(userCount.count)
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

export const storeUserAclFactory =
  (deps: { db: Knex }): StoreUserAcl =>
  async (params) => {
    const { acl } = params
    const [newAcl] = await tables.serverAcl(deps.db).insert(acl, '*')
    return newAcl
  }
