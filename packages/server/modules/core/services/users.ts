'use strict'
import bcrypt from 'bcrypt'
import crs from 'crypto-random-string'
import knex from '@/db/knex'
import {
  ServerAcl as ServerAclSchema,
  Users as UsersSchema
} from '@/modules/core/dbSchema'
import {
  validateUserPassword,
  updateUserAndNotify,
  MINIMUM_PASSWORD_LENGTH
} from '@/modules/core/services/users/management'

const Users = () => UsersSchema.knex()
const Acl = () => ServerAclSchema.knex()

import { deleteStream } from './streams'
import { LIMITED_USER_FIELDS } from '@/modules/core/helpers/userHelper'
import { deleteAllUserInvites } from '@/modules/serverinvites/repositories'
import { getUserByEmail as getUserByEmailFromRepository } from '@/modules/core/repositories/users'
import { UsersEmitter, UsersEvents } from '@/modules/core/events/usersEmitter'
import { pick } from 'lodash'
import { dbLogger } from '@/logging/logging'
import { UserInputError, PasswordTooShortError } from '@/modules/core/errors/userinput'
import { Nullable, Roles, ServerRoles, isServerRole } from '@speckle/shared'
import { getServerInfo } from '@/modules/core/services/generic'
import { UserUpdateInput } from '@/modules/core/graph/generated/graphql'
import { UserRecord } from '../helpers/types'

const _changeUserRole = async ({
  userId,
  role
}: {
  userId: string
  role: ServerRoles
}) => await Acl().where({ userId }).update({ role })

const countAdminUsers = async () => {
  const [{ count }] = await Acl().where({ role: Roles.Server.Admin }).count()
  return parseInt(count)
}
const _ensureAtleastOneAdminRemains = async (userId: string) => {
  if ((await countAdminUsers()) === 1) {
    const currentAdmin = await Acl().where({ role: Roles.Server.Admin }).first()
    if (currentAdmin.userId === userId) {
      throw new UserInputError('Cannot remove the last admin role from the server')
    }
  }
}

const userByEmailQuery = (email: string) =>
  Users().whereRaw('lower(email) = lower(?)', [email])

const getUsersBaseQuery = (searchQuery: string | null = null) => {
  const query = Users()
  if (searchQuery) {
    query.where((queryBuilder) => {
      queryBuilder
        .where('email', 'ILIKE', `%${searchQuery}%`)
        .orWhere('name', 'ILIKE', `%${searchQuery}%`)
        .orWhere('company', 'ILIKE', `%${searchQuery}%`)
    })
  }
  return query
}

/*
    Users
  */

type UserInput = {
  id?: string
  email: string
  password?: string
  passwordDigest?: Nullable<string>
  role?: string
  bio?: Nullable<string>
  name: string
  company?: Nullable<string>
  verified?: boolean
}

export async function createUser(
  user: UserInput,
  options?: { skipPropertyValidation: boolean }
): Promise<string> {
  // ONLY ALLOW SKIPPING WHEN CREATING USERS FOR TESTS, IT'S UNSAFE OTHERWISE
  const { skipPropertyValidation = false } = options || {
    skipPropertyValidation: false
  }

  let expectedRole = null
  if (user.role) {
    const isValidRole = isServerRole(user.role)
    const isValidIfGuestModeEnabled =
      user.role !== Roles.Server.Guest || (await getServerInfo()).guestModeEnabled
    expectedRole = isValidRole && isValidIfGuestModeEnabled ? user.role : null
  }
  delete user.role

  user = skipPropertyValidation
    ? user
    : (pick(user, ['id', 'bio', 'email', 'password', 'name', 'company']) as UserInput)

  const newId = crs({ length: 10 })
  user.id = newId
  user.email = user.email.toLowerCase()

  if (user.password) {
    if (user.password.length < MINIMUM_PASSWORD_LENGTH)
      throw new PasswordTooShortError(MINIMUM_PASSWORD_LENGTH)
    user.passwordDigest = await bcrypt.hash(user.password, 10)
  }
  delete user.password

  const usr = await userByEmailQuery(user.email).select('id').first()
  if (usr) throw new UserInputError('Email taken. Try logging in?')

  const [newUser] = (await Users().insert(user, UsersSchema.cols)) || []
  if (!newUser) throw new Error("Couldn't create user")

  const userRole =
    (await countAdminUsers()) === 0
      ? Roles.Server.Admin
      : expectedRole || Roles.Server.User

  await Acl().insert({ userId: newId, role: userRole })

  await UsersEmitter.emit(UsersEvents.Created, { user: newUser })

  return newUser.id
}

/**
 * @returns {Promise<{
 *  id: string,
 *  email: string,
 *  isNewUser?: boolean
 * }>}
 */
export async function findOrCreateUser({ user }: { user: UserInput }) {
  const existingUser = await userByEmailQuery(user.email)
    .select(['id', 'email'])
    .first()
  if (existingUser) return existingUser

  user.password = crs({ length: 20 })
  user.verified = true // because we trust the external identity provider, no?

  return {
    id: await createUser(user),
    email: user.email,
    isNewUser: true
  }
}

export async function getUserById({
  userId
}: {
  userId: string
}): Promise<UserRecord | null> {
  const user = await Users().where({ id: userId }).select('*').first()
  if (user) delete user.passwordDigest
  return user
}

/**
 * @deprecated {Use getUserById()}
 */
export async function getUser(id: string) {
  return getUserById({ userId: id })
}

export async function getUserByEmail({ email }: { email: string }) {
  const user = await userByEmailQuery(email).select('*').first()
  if (!user) return null
  delete user.passwordDigest
  return user
}

export async function getUserRole(id: string) {
  const { role } = (await Acl().where({ userId: id }).select('role').first()) || {
    role: null
  }
  return role
}

/**
 * @deprecated {Use updateUserAndNotify() or repo method directly}
 */
export async function updateUser(id: string, user: UserUpdateInput) {
  return await updateUserAndNotify(id, user)
}

/**
 * @deprecated {Use changePassword()}
 */
export async function updateUserPassword({
  id,
  newPassword
}: {
  id: string
  newPassword: string
}) {
  if (newPassword.length < MINIMUM_PASSWORD_LENGTH)
    throw new PasswordTooShortError(MINIMUM_PASSWORD_LENGTH)
  const passwordDigest = await bcrypt.hash(newPassword, 10)
  await Users().where({ id }).update({ passwordDigest })
}

/**
 * User search available for normal server users. It's more limited because of the lower access level.
 */
export async function searchUsers(
  searchQuery: string,
  limit: number,
  cursor?: string,
  archived = false,
  emailOnly = false
) {
  const query = Users()
    .join('server_acl', 'users.id', 'server_acl.userId')
    .select(...LIMITED_USER_FIELDS)
    .where((queryBuilder) => {
      queryBuilder.where({ email: searchQuery }) //match full email or partial name
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

/**
 * @deprecated {Use validateUserPassword()}
 */
export async function validatePasssword({
  email,
  password
}: {
  email: string
  password: string
}) {
  const user = await getUserByEmailFromRepository(email, { skipClean: true })
  if (!user) return false
  return await validateUserPassword({
    password,
    user
  })
}

export async function deleteUser(id: string) {
  dbLogger.info({ userId: id }, 'Attempting to delete user with id: {userId}')
  await _ensureAtleastOneAdminRemains(id)
  const streams = await knex.raw(
    `
      -- Get the stream ids with only this user as owner
      SELECT "resourceId" as id
      FROM (
        -- Compute (streamId, ownerCount) table for streams on which the user is owner
        SELECT acl."resourceId", count(*) as cnt
        FROM stream_acl acl
        INNER JOIN
          (
          -- Get streams ids on which the user is owner
          SELECT "resourceId" FROM stream_acl
          WHERE role = '${Roles.Stream.Owner}' AND "userId" = ?
          ) AS us ON acl."resourceId" = us."resourceId"
        WHERE acl.role = '${Roles.Stream.Owner}'
        GROUP BY (acl."resourceId")
      ) AS soc
      WHERE cnt = 1
      `,
    [id]
  )
  for (const i in streams.rows) {
    await deleteStream({ streamId: streams.rows[i].id })
  }

  // Delete all invites (they don't have a FK, so we need to do this manually)
  await deleteAllUserInvites(id)

  return await Users().where({ id }).del()
}

/**
 * Get all users or filter them with the specified searchQuery. This is meant for
 * server admins, because it exposes the User object (& thus the email).
 * @returns {Promise<import('@/modules/core/helpers/userHelper').UserRecord[]>}
 */
export async function getUsers(
  limit = 10,
  offset = 0,
  searchQuery: string | null = null
): Promise<UserRecord[]> {
  // sanitize limit
  const maxLimit = 200
  if (limit > maxLimit) limit = maxLimit

  const query = getUsersBaseQuery(searchQuery)
  query.limit(limit).offset(offset)

  const users = await query
  users.map((user: unknown) => {
    if (user && typeof user === 'object' && 'passwordDigest' in user)
      delete user.passwordDigest
  })
  //TODO parse into UserRecord[]
  return users
}

export async function countUsers(searchQuery: string | null = null) {
  const query = getUsersBaseQuery(searchQuery)
  const [userCount] = await query.count()
  return parseInt(userCount.count)
}

export async function changeUserRole({
  userId,
  role,
  guestModeEnabled = false
}: {
  userId: string
  role: string
  guestModeEnabled: boolean
}) {
  if (!isServerRole(role)) throw new UserInputError(`Invalid role specified: ${role}`)
  if (!guestModeEnabled && role === Roles.Server.Guest)
    throw new UserInputError('Guest role is not enabled')
  if (role !== Roles.Server.Admin) await _ensureAtleastOneAdminRemains(userId)
  await _changeUserRole({ userId, role })
}
