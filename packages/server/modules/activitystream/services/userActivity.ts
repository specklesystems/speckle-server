import { UserUpdateInput } from '@/modules/core/graph/generated/graphql'
import { UserRecord } from '@/modules/core/helpers/types'
import { ActionTypes, ResourceTypes } from '@/modules/activitystream/helpers/types'
import { SaveActivity } from '@/modules/activitystream/domain/operations'
import { EventBusListen, EventPayload } from '@/modules/shared/services/eventBus'
import { UserEvents } from '@/modules/core/domain/users/events'

const addUserCreatedActivityFactory =
  ({ saveActivity }: { saveActivity: SaveActivity }) =>
  async (payload: EventPayload<typeof UserEvents.Created>) => {
    const { user } = payload.payload

    await saveActivity({
      streamId: null,
      resourceType: 'user',
      resourceId: user.id,
      actionType: 'user_create',
      userId: user.id,
      info: { user },
      message: 'User created'
    })
  }

const addUserUpdatedActivityFactory =
  ({ saveActivity }: { saveActivity: SaveActivity }) =>
  async (params: {
    oldUser: UserRecord
    update: UserUpdateInput
    updaterId: string
  }) => {
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

const addUserDeletedActivityFactory =
  (deps: { saveActivity: SaveActivity }) =>
  async (params: { targetUserId: string; invokerUserId: string }) => {
    const { targetUserId, invokerUserId } = params

    await deps.saveActivity({
      streamId: null,
      resourceType: 'user',
      resourceId: targetUserId,
      actionType: ActionTypes.User.Delete,
      userId: invokerUserId,
      info: {},
      message: 'User deleted'
    })
  }

export const reportUserActivityFactory =
  (deps: { eventListen: EventBusListen; saveActivity: SaveActivity }) => () => {
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
