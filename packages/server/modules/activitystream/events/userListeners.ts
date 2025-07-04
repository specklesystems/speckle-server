import { UserUpdateInput } from '@/modules/core/graph/generated/graphql'
import { UserRecord } from '@/modules/core/helpers/types'
import {
  StreamActionTypes,
  StreamResourceTypes
} from '@/modules/activitystream/helpers/types'
import { SaveStreamActivity } from '@/modules/activitystream/domain/operations'
import { EventBusListen, EventPayload } from '@/modules/shared/services/eventBus'
import { UserEvents } from '@/modules/core/domain/users/events'

const addUserCreatedActivityFactory =
  ({ saveStreamActivity }: { saveStreamActivity: SaveStreamActivity }) =>
  async (payload: EventPayload<typeof UserEvents.Created>) => {
    const { user } = payload.payload

    await saveStreamActivity({
      streamId: null,
      resourceType: StreamResourceTypes.User,
      resourceId: user.id,
      actionType: StreamActionTypes.User.Create,
      userId: user.id,
      info: { user },
      message: 'User created'
    })
  }

const addUserUpdatedActivityFactory =
  ({ saveStreamActivity }: { saveStreamActivity: SaveStreamActivity }) =>
  async (params: {
    oldUser: UserRecord
    update: UserUpdateInput
    updaterId: string
  }) => {
    const { oldUser, update, updaterId } = params

    await saveStreamActivity({
      streamId: null,
      resourceType: StreamResourceTypes.User,
      resourceId: oldUser.id,
      actionType: StreamActionTypes.User.Update,
      userId: updaterId,
      info: { old: oldUser, new: update },
      message: 'User updated'
    })
  }

const addUserDeletedActivityFactory =
  (deps: { saveStreamActivity: SaveStreamActivity }) =>
  async (params: { targetUserId: string; invokerUserId: string }) => {
    const { targetUserId, invokerUserId } = params

    await deps.saveStreamActivity({
      streamId: null,
      resourceType: 'user',
      resourceId: targetUserId,
      actionType: StreamActionTypes.User.Delete,
      userId: invokerUserId,
      info: {},
      message: 'User deleted'
    })
  }

export const reportUserActivityFactory =
  (deps: { eventListen: EventBusListen; saveStreamActivity: SaveStreamActivity }) =>
  () => {
    const addUserDeletedActivity = addUserDeletedActivityFactory(deps)
    const addUserUpdatedActivity = addUserUpdatedActivityFactory(deps)
    const addUserCreatedActivity = addUserCreatedActivityFactory(deps)

    const quitters = [
      deps.eventListen(UserEvents.Deleted, async ({ payload }) => {
        await addUserDeletedActivity(payload)
      }),
      deps.eventListen(UserEvents.Created, addUserCreatedActivity),
      deps.eventListen(UserEvents.Updated, async ({ payload }) => {
        await addUserUpdatedActivity(payload)
      })
    ]

    return () => quitters.forEach((q) => q())
  }
