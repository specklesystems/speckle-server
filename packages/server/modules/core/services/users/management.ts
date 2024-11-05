import { addUserUpdatedActivityFactory } from '@/modules/activitystream/services/userActivity'
import {
  ChangeUserPassword,
  ChangeUserRole,
  CountAdminUsers,
  CreateValidatedUser,
  DeleteUser,
  DeleteUserRecord,
  FindOrCreateValidatedUser,
  GetUser,
  GetUserByEmail,
  IsLastAdminUser,
  StoreUser,
  StoreUserAcl,
  UpdateUser,
  UpdateUserAndNotify,
  UpdateUserServerRole,
  ValidateUserPassword
} from '@/modules/core/domain/users/operations'
import { UserUpdateError, UserValidationError } from '@/modules/core/errors/user'
import { PasswordTooShortError, UserInputError } from '@/modules/core/errors/userinput'
import { UserUpdateInput } from '@/modules/core/graph/generated/graphql'
import type { UserRecord } from '@/modules/core/helpers/userHelper'
import { sanitizeImageUrl } from '@/modules/shared/helpers/sanitization'
import {
  isNullOrUndefined,
  NullableKeysToOptional,
  Roles,
  ServerRoles
} from '@speckle/shared'
import { pick } from 'lodash'
import bcrypt from 'bcrypt'
import crs from 'crypto-random-string'
import {
  FindEmail,
  FindPrimaryEmailForUser,
  ValidateAndCreateUserEmail
} from '@/modules/core/domain/userEmails/operations'
import { UsersEvents, UsersEventsEmitter } from '@/modules/core/events/usersEmitter'
import {
  DeleteStreamRecord,
  GetUserDeletableStreams
} from '@/modules/core/domain/streams/operations'
import { Logger } from '@/logging/logging'
import { DeleteAllUserInvites } from '@/modules/serverinvites/domain/operations'
import { GetServerInfo } from '@/modules/core/domain/server/operations'

export const MINIMUM_PASSWORD_LENGTH = 8

const createPasswordDigest = async (newPassword: string) => {
  return await bcrypt.hash(newPassword, 10)
}

export const updateUserAndNotifyFactory =
  (deps: {
    getUser: GetUser
    updateUser: UpdateUser
    addUserUpdatedActivity: ReturnType<typeof addUserUpdatedActivityFactory>
  }): UpdateUserAndNotify =>
  async (userId: string, update: UserUpdateInput) => {
    const existingUser = await deps.getUser(userId)
    if (!existingUser) {
      throw new UserUpdateError('Attempting to update a non-existant user')
    }

    const filteredUpdate: Partial<UserRecord> = {}
    for (const entry of Object.entries(update)) {
      const key = entry[0] as keyof typeof update
      let val = entry[1]

      if (key === 'avatar') {
        val = sanitizeImageUrl(val)
      }

      if (!isNullOrUndefined(val)) {
        filteredUpdate[key] = val
      }
    }

    const newUser = await deps.updateUser(userId, filteredUpdate)
    if (!newUser) {
      throw new UserUpdateError("Couldn't update user")
    }

    await deps.addUserUpdatedActivity({
      oldUser: existingUser,
      update,
      updaterId: userId
    })

    return newUser
  }

export const validateUserPasswordFactory =
  (deps: { getUserByEmail: GetUserByEmail }): ValidateUserPassword =>
  async (params) => {
    const { email, password } = params
    const user = await deps.getUserByEmail(email, { skipClean: true })
    if (!user) return false

    if (!user.passwordDigest) {
      throw new UserValidationError(
        'Could not validate user credentials due to missing metadata'
      )
    }

    return await bcrypt.compare(password, user.passwordDigest)
  }

export const changePasswordFactory =
  (deps: { getUser: GetUser; updateUser: UpdateUser }): ChangeUserPassword =>
  async (params) => {
    const { newPassword, id: userId } = params
    const user = await deps.getUser(userId, { skipClean: true })
    if (!user) {
      throw new UserUpdateError('Could not find the user with the specified id')
    }

    if (newPassword.length < MINIMUM_PASSWORD_LENGTH) {
      throw new PasswordTooShortError(MINIMUM_PASSWORD_LENGTH)
    }

    const passwordDigest = await createPasswordDigest(newPassword)
    await deps.updateUser(
      userId,
      {
        passwordDigest
      },
      { skipClean: true }
    )
  }

export const createUserFactory =
  (deps: {
    getServerInfo: GetServerInfo
    findEmail: FindEmail
    storeUser: StoreUser
    countAdminUsers: CountAdminUsers
    storeUserAcl: StoreUserAcl
    validateAndCreateUserEmail: ValidateAndCreateUserEmail
    usersEventsEmitter: UsersEventsEmitter
  }): CreateValidatedUser =>
  async (user, options = undefined) => {
    // ONLY ALLOW SKIPPING WHEN CREATING USERS FOR TESTS, IT'S UNSAFE OTHERWISE
    const { skipPropertyValidation = false } = options || {}

    const signUpCtx = user.signUpContext

    let finalUser: typeof user &
      Omit<NullableKeysToOptional<UserRecord>, 'suuid' | 'createdAt'> = {
      ...user,
      id: crs({ length: 10 }),
      verified: user.verified || false
    }
    delete finalUser.signUpContext

    if (!finalUser.email?.length) throw new UserInputError('E-mail address is required')

    let expectedRole = null
    if (finalUser.role) {
      const isValidRole = Object.values(Roles.Server).includes(finalUser.role)
      const isValidIfGuestModeEnabled =
        finalUser.role !== Roles.Server.Guest ||
        (await deps.getServerInfo()).guestModeEnabled
      expectedRole = isValidRole && isValidIfGuestModeEnabled ? finalUser.role : null
    }
    delete finalUser.role

    finalUser = skipPropertyValidation
      ? finalUser
      : (pick(finalUser, [
          'id',
          'bio',
          'email',
          'password',
          'name',
          'company',
          'verified',
          'avatar'
        ]) as typeof finalUser)

    finalUser.email = finalUser.email.toLowerCase()

    if (!finalUser.name) throw new UserInputError('User name is required')

    if (finalUser.avatar) {
      finalUser.avatar = sanitizeImageUrl(user.avatar)
    }

    if (finalUser.password) {
      if (finalUser.password.length < MINIMUM_PASSWORD_LENGTH)
        throw new PasswordTooShortError(MINIMUM_PASSWORD_LENGTH)
      finalUser.passwordDigest = await bcrypt.hash(finalUser.password, 10)
    }
    delete finalUser.password

    const userEmail = await deps.findEmail({
      email: finalUser.email
    })
    if (userEmail) throw new UserInputError('Email taken. Try logging in?')

    const newUser = await deps.storeUser({ user: finalUser })
    if (!newUser) throw new Error("Couldn't create user")

    const userRole =
      (await deps.countAdminUsers()) === 0
        ? Roles.Server.Admin
        : expectedRole || Roles.Server.User

    await deps.storeUserAcl({
      acl: {
        userId: finalUser.id,
        role: userRole
      }
    })

    await deps.validateAndCreateUserEmail({
      userEmail: {
        email: finalUser.email,
        userId: finalUser.id,
        verified: finalUser.verified,
        primary: true
      }
    })

    await deps.usersEventsEmitter(UsersEvents.Created, { user: newUser, signUpCtx })

    return newUser.id
  }

export const findOrCreateUserFactory =
  (deps: {
    findPrimaryEmailForUser: FindPrimaryEmailForUser
    createUser: CreateValidatedUser
  }): FindOrCreateValidatedUser =>
  async (params) => {
    const { user } = params

    const userEmail = await deps.findPrimaryEmailForUser({
      email: user.email
    })
    if (userEmail) return { id: userEmail.userId, email: userEmail.email }

    return {
      id: await deps.createUser({
        ...user,
        verified: true, // because we trust the external identity provider, no?
        password: crs({ length: 20 })
      }),
      email: user.email,
      isNewUser: true
    }
  }

export const deleteUserFactory =
  (deps: {
    deleteStream: DeleteStreamRecord
    logger: Logger
    isLastAdminUser: IsLastAdminUser
    getUserDeletableStreams: GetUserDeletableStreams
    deleteAllUserInvites: DeleteAllUserInvites
    deleteUserRecord: DeleteUserRecord
  }): DeleteUser =>
  async (id) => {
    deps.logger.info('Deleting user ' + id)
    const isLastAdmin = await deps.isLastAdminUser(id)
    if (isLastAdmin) {
      throw new UserInputError('Cannot remove the last admin role from the server')
    }

    const streamIds = await deps.getUserDeletableStreams(id)
    for (const id of streamIds) {
      await deps.deleteStream(id)
    }

    // Delete all invites (they don't have a FK, so we need to do this manually)
    // THIS REALLY SHOULD BE A REACTION TO THE USER DELETED EVENT EMITTED HER
    await deps.deleteAllUserInvites(id)

    return await deps.deleteUserRecord(id)
  }

export const changeUserRoleFactory =
  (deps: {
    getServerInfo: GetServerInfo
    isLastAdminUser: IsLastAdminUser
    updateUserServerRole: UpdateUserServerRole
  }): ChangeUserRole =>
  async ({ userId, role }) => {
    const guestModeEnabled = (await deps.getServerInfo()).guestModeEnabled
    if (!(Object.values(Roles.Server) as string[]).includes(role))
      throw new UserInputError(`Invalid role specified: ${role}`)

    if (!guestModeEnabled && role === Roles.Server.Guest)
      throw new UserInputError('Guest role is not enabled')

    if (role !== Roles.Server.Admin) {
      const isLastAdmin = await deps.isLastAdminUser(userId)
      if (isLastAdmin) {
        throw new UserInputError('Cannot remove the last admin role from the server')
      }
    }

    await deps.updateUserServerRole({ userId, role: role as ServerRoles })
  }
