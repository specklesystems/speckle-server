import { ServerAcl, UserEmails, Users, knex } from '@/modules/core/dbSchema'
import {
  LimitedUserRecord,
  UserRecord,
  UserWithRole
} from '@/modules/core/helpers/types'
import { Nullable } from '@/modules/shared/helpers/typeHelper'
import { clamp, isArray, omit } from 'lodash'
import { metaHelpers } from '@/modules/core/helpers/meta'
import { UserValidationError } from '@/modules/core/errors/user'
import { Knex } from 'knex'
import { Roles, ServerRoles } from '@speckle/shared'
import { updateUserEmailFactory } from '@/modules/core/repositories/userEmails'
import { db } from '@/db/knex'
import { markUserEmailAsVerifiedFactory } from '@/modules/core/services/users/emailVerification'

export type UserWithOptionalRole<User extends LimitedUserRecord = UserRecord> = User & {
  /**
   * Available, if query joined this data from server_acl
   * (this can be the server role or stream role depending on how and where this was retrieved)
   */
  role?: ServerRoles
}

export type GetUserParams = Partial<{
  /**
   * Join server_acl and get user role info
   */
  withRole: boolean

  /**
   * Skip record sanitization. ONLY use when you wish to work with a user's password digest
   */
  skipClean: boolean
}>

function sanitizeUserRecord<T extends Nullable<UserRecord>>(user: T): T {
  if (!user) return user
  delete user.passwordDigest
  return user
}

// This function is exported because it is used in services
// Once we will refactor services this one should not be exported
export const getUsersBaseQuery = (
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
export async function getUsers(
  userIds: string | string[],
  params?: GetUserParams
): Promise<UserWithOptionalRole[]> {
  const { withRole, skipClean } = params || {}
  userIds = isArray(userIds) ? userIds : [userIds]

  const q = Users.knex<UserWithOptionalRole[]>().whereIn(Users.col.id, userIds)
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

  q.columns(columns)
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
export async function getUser(userId: string, params?: GetUserParams) {
  if (!userId) return null
  const users = await getUsers([userId], params)
  return users?.[0] || null
}

/**
 * Get user by e-mail address
 */
export async function getUserByEmail(
  email: string,
  options?: Partial<{ skipClean: boolean; withRole: boolean }>
) {
  const q = Users.knex<UserWithOptionalRole[]>()
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
  const user = await q.first()
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

  const meta = metaHelpers(Users)
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
