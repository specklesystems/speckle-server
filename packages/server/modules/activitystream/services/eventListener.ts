import { db } from '@/db/knex'
import {
  AccessRequestsEmitter,
  AccessRequestsEvents,
  AccessRequestsEventsPayloads
} from '@/modules/accessrequests/events/emitter'
import { AccessRequestType } from '@/modules/accessrequests/repositories'
import { saveActivityFactory } from '@/modules/activitystream/repositories'
import {
  addStreamAccessRequestDeclinedActivity,
  addStreamAccessRequestedActivity
} from '@/modules/activitystream/services/accessRequestActivity'
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

async function onServerAccessRequestCreated(
  payload: AccessRequestsEventsPayloads[AccessRequestsEvents.Created]
) {
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

async function onServerAccessRequestFinalized(
  payload: AccessRequestsEventsPayloads[AccessRequestsEvents.Finalized]
) {
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
export function initializeEventListener() {
  const quitCbs = [
    UsersEmitter.listen(UsersEvents.Created, onUserCreated),
    AccessRequestsEmitter.listen(
      AccessRequestsEvents.Created,
      onServerAccessRequestCreated
    ),
    AccessRequestsEmitter.listen(
      AccessRequestsEvents.Finalized,
      onServerAccessRequestFinalized
    )
  ]

  return () => quitCbs.forEach((quit) => quit())
}
