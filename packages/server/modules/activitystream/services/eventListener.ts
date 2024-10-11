import { db } from '@/db/knex'
import {
  AccessRequestsEmitter,
  AccessRequestsEvents,
  AccessRequestsEventsPayloads
} from '@/modules/accessrequests/events/emitter'
import { AccessRequestType } from '@/modules/accessrequests/repositories'
import {
  AddStreamAccessRequestDeclinedActivity,
  AddStreamAccessRequestedActivity
} from '@/modules/activitystream/domain/operations'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import {
  UsersEmitter,
  UsersEvents,
  UsersEventsPayloads
} from '@/modules/core/events/usersEmitter'

async function onUserCreated(payload: UsersEventsPayloads[UsersEvents.Created]) {
  const { user } = payload

  await saveActivityFactory({ db })({
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
    addStreamAccessRequestDeclinedActivity
  }: {
    addStreamAccessRequestedActivity: AddStreamAccessRequestedActivity
    addStreamAccessRequestDeclinedActivity: AddStreamAccessRequestDeclinedActivity
  }) =>
  () => {
    const quitCbs = [
      UsersEmitter.listen(UsersEvents.Created, onUserCreated),
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
