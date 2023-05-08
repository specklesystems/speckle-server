import { ServerAcl, Users, knex } from '@/modules/core/dbSchema'
import { LimitedUserRecord, UserRecord } from '@/modules/core/helpers/types'
import { Nullable } from '@/modules/shared/helpers/typeHelper'
import { isArray } from 'lodash'
import { metaHelpers } from '@/modules/core/helpers/meta'
import { UserValidationError } from '@/modules/core/errors/user'

export type UserWithOptionalRole<User extends LimitedUserRecord = UserRecord> = User & {
  /**
   * Available, if query joined this data from server_acl
   * (this can be the server role or stream role depending on how and where this was retrieved)
   */
  role?: string
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
  if (withRole) {
    q.columns([
      ...Object.values(Users.col),
      // Getting first role from grouped results
      knex.raw(`(array_agg("server_acl"."role"))[1] as role`)
    ])
    q.leftJoin(ServerAcl.name, ServerAcl.col.userId, Users.col.id)
    q.groupBy(Users.col.id)
  }

  return (await q).map((u) => (skipClean ? u : sanitizeUserRecord(u)))
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
  options?: Partial<{ skipClean: boolean }>
) {
  const q = Users.knex<UserRecord[]>().whereRaw('lower(email) = lower(?)', [email])
  const user = await q.first()
  return user ? (!options?.skipClean ? sanitizeUserRecord(user) : user) : null
}

/**
 * Mark a user as verified by e-mail address, and return true on success
 */
export async function markUserAsVerified(email: string) {
  const UserCols = Users.with({ withoutTablePrefix: true }).col
  const q = Users.knex()
    .whereRaw('lower(email) = lower(?)', [email])
    .update({
      [UserCols.verified]: true
    })

  return !!(await q)
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
  return newUser as Nullable<UserRecord>
}
