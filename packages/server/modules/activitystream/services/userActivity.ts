import { ActionTypes, ResourceTypes } from '@/modules/activitystream/helpers/types'
import { saveActivity } from '@/modules/activitystream/services'
import { UserUpdateInput } from '@/modules/core/graph/generated/graphql'
import { UserRecord } from '@/modules/core/helpers/types'

export async function addUserUpdatedActivity(params: {
  oldUser: UserRecord
  update: UserUpdateInput
  updaterId: string
}) {
  const { oldUser, update, updaterId } = params

  await saveActivity({
    streamId: null,
    resourceType: ResourceTypes.User,
    resourceId: oldUser.id,
    actionType: ActionTypes.User.Update,
    userId: updaterId,
    info: { old: oldUser, new: update },
    message: 'User updated'
  })
}
