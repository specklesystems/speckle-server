import { addUserUpdatedActivity } from '@/modules/activitystream/services/userActivity'
import { UserUpdateError } from '@/modules/core/errors/user'
import { UserUpdateInput } from '@/modules/core/graph/generated/graphql'
import { UserRecord } from '@/modules/core/helpers/userHelper'
import { getUser, updateUser } from '@/modules/core/repositories/users'
import { isNullOrUndefined } from '@speckle/shared'

export async function updateUserAndNotify(userId: string, update: UserUpdateInput) {
  const existingUser = await getUser(userId)
  if (!existingUser) {
    throw new UserUpdateError('Attempting to update a non-existant user')
  }

  const filteredUpdate: Partial<UserRecord> = {}
  for (const entry of Object.entries(update)) {
    const key = entry[0] as keyof typeof update
    const val = entry[1]

    if (!isNullOrUndefined(val)) {
      filteredUpdate[key] = val
    }
  }

  const newUser = await updateUser(userId, filteredUpdate)
  if (!newUser) {
    throw new UserUpdateError("Couldn't update user")
  }

  await addUserUpdatedActivity({
    oldUser: existingUser,
    update,
    updaterId: userId
  })

  return newUser
}
