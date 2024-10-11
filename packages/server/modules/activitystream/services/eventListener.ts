import {
  AccessRequestsEmitter,
  AccessRequestsEvents,
  AccessRequestsEventsPayloads
} from '@/modules/accessrequests/events/emitter'
import { AccessRequestType } from '@/modules/accessrequests/repositories'
import {
  AddStreamAccessRequestDeclinedActivity,
  AddStreamAccessRequestedActivity,
  SaveActivity
} from '@/modules/activitystream/domain/operations'
import {
  UsersEmitter,
  UsersEvents,
  UsersEventsPayloads
} from '@/modules/core/events/usersEmitter'

const onUserCreatedFactory =
  ({ saveActivity }: { saveActivity: SaveActivity }) =>
  async (payload: UsersEventsPayloads[UsersEvents.Created]) => {
    const { user } = payload

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

const onServerAccessRequestCreatedFactory =
  ({
    addStreamAccessRequestedActivity
  }: {
    addStreamAccessRequestedActivity: AddStreamAccessRequestedActivity
  }) =>
  async (payload: AccessRequestsEventsPayloads[AccessRequestsEvents.Created]) => {
    const {
      request: { resourceId, resourceType, requesterId }
    } = payload
    if (!resourceId) return

    if (resourceType === AccessRequestType.Stream) {
      await addStreamAccessRequestedActivity({
        streamId: resourceId,
        requesterId
      })
    }
  }

const onServerAccessRequestFinalizedFactory =
  ({
    addStreamAccessRequestDeclinedActivity
  }: {
    addStreamAccessRequestDeclinedActivity: AddStreamAccessRequestDeclinedActivity
  }) =>
  async (payload: AccessRequestsEventsPayloads[AccessRequestsEvents.Finalized]) => {
    const {
      approved,
      finalizedBy,
      request: { resourceId, resourceType, requesterId }
    } = payload
    if (!resourceId) return

    if (resourceType === AccessRequestType.Stream) {
      // If user was added to stream, an activity stream item was already added from 'addOrUpdateStreamCollaborator'
      if (approved) return

      await addStreamAccessRequestDeclinedActivity({
        streamId: resourceId,
        requesterId,
        declinerId: finalizedBy
      })
    }
  }

/**
 * Initialize event listener for tracking various Speckle events and responding
 * to them by creating activitystream entries
 */
export const initializeEventListenerFactory =
  ({
    addStreamAccessRequestedActivity,
    addStreamAccessRequestDeclinedActivity,
    saveActivity
  }: {
    addStreamAccessRequestedActivity: AddStreamAccessRequestedActivity
    addStreamAccessRequestDeclinedActivity: AddStreamAccessRequestDeclinedActivity
    saveActivity: SaveActivity
  }) =>
  () => {
    const quitCbs = [
      UsersEmitter.listen(UsersEvents.Created, onUserCreatedFactory({ saveActivity })),
      AccessRequestsEmitter.listen(
        AccessRequestsEvents.Created,
        onServerAccessRequestCreatedFactory({ addStreamAccessRequestedActivity })
      ),
      AccessRequestsEmitter.listen(
        AccessRequestsEvents.Finalized,
        onServerAccessRequestFinalizedFactory({
          addStreamAccessRequestDeclinedActivity
        })
      )
    ]

    return () => quitCbs.forEach((quit) => quit())
  }
