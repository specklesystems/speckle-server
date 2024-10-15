import { db } from '@/db/knex'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import { addUserUpdatedActivityFactory } from '@/modules/activitystream/services/userActivity'
import { UserUpdateError, UserValidationError } from '@/modules/core/errors/user'
import { PasswordTooShortError } from '@/modules/core/errors/userinput'
import { UserUpdateInput } from '@/modules/core/graph/generated/graphql'
import type { UserRecord } from '@/modules/core/helpers/userHelper'
import { getUserFactory, updateUser } from '@/modules/core/repositories/users'
import { sanitizeImageUrl } from '@/modules/shared/helpers/sanitization'
import { isNullOrUndefined } from '@speckle/shared'
import bcrypt from 'bcrypt'

export const MINIMUM_PASSWORD_LENGTH = 8

export async function updateUserAndNotify(userId: string, update: UserUpdateInput) {
  const getUser = getUserFactory({ db })
  const existingUser = await getUser(userId)
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

  const newUser = await updateUser(userId, filteredUpdate)
  if (!newUser) {
    throw new UserUpdateError("Couldn't update user")
  }

  await addUserUpdatedActivityFactory({
    saveActivity: saveActivityFactory({ db })
  })({
    oldUser: existingUser,
    update,
    updaterId: userId
  })

  return newUser
}

export async function validateUserPassword(params: {
  user: UserRecord
  password: string
}) {
  const { user, password } = params
  if (!user.passwordDigest) {
    throw new UserValidationError(
      'Could not validate user credentials due to missing metadata'
    )
  }

  return await bcrypt.compare(password, user.passwordDigest)
}

export async function createPasswordDigest(newPassword: string) {
  return await bcrypt.hash(newPassword, 10)
}

export async function changePassword(
  userId: string,
  input: { oldPassword: string; newPassword: string }
) {
  const { oldPassword, newPassword } = input
  const getUser = getUserFactory({ db })
  const user = await getUser(userId, { skipClean: true })
  if (!user) {
    throw new UserUpdateError('Could not find the user with the specified id')
  }

  const isOldPasswordValid = await validateUserPassword({
    user,
    password: oldPassword
  })
  if (!isOldPasswordValid) {
    throw new UserUpdateError('Old password is incorrect')
  }

  if (newPassword.length < MINIMUM_PASSWORD_LENGTH) {
    throw new PasswordTooShortError(MINIMUM_PASSWORD_LENGTH)
  }

  const passwordDigest = await createPasswordDigest(newPassword)
  await updateUser(
    userId,
    {
      passwordDigest
    },
    { skipClean: true }
  )
}
