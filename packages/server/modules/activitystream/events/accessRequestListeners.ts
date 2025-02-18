import { EventBusListen, EventPayload } from '@/modules/shared/services/eventBus'
import {
  AddStreamAccessRequestDeclinedActivity,
  AddStreamAccessRequestedActivity,
  SaveActivity
} from '@/modules/activitystream/domain/operations'
import { ActionTypes, ResourceTypes } from '@/modules/activitystream/helpers/types'
import { AccessRequestEvents } from '@/modules/accessrequests/domain/events'
import {
  AccessRequestType,
  isStreamAccessRequest
} from '@/modules/accessrequests/repositories'

/**
 * Save a "stream access requested" activity
 */
const addStreamAccessRequestedActivityFactory =
  ({
    saveActivity
  }: {
    saveActivity: SaveActivity
  }): AddStreamAccessRequestedActivity =>
  async (params: { streamId: string; requesterId: string }) => {
    const { streamId, requesterId } = params
    await saveActivity({
      streamId,
      resourceType: ResourceTypes.Stream,
      resourceId: streamId,
      userId: requesterId,
      actionType: ActionTypes.Stream.AccessRequestSent,
      message: `User ${requesterId} has requested access to stream ${streamId}`,
      info: { requesterId }
    })
  }

/**
 * Save a "stream acccess request declined/denied" activity
 */
const addStreamAccessRequestDeclinedActivityFactory =
  ({
    saveActivity
  }: {
    saveActivity: SaveActivity
  }): AddStreamAccessRequestDeclinedActivity =>
  async (params: { streamId: string; requesterId: string; declinerId: string }) => {
    const { streamId, requesterId, declinerId } = params
    await saveActivity({
      streamId,
      resourceType: ResourceTypes.Stream,
      resourceId: streamId,
      userId: declinerId,
      actionType: ActionTypes.Stream.AccessRequestDeclined,
      message: `User ${declinerId} declined access to stream ${streamId} for user ${requesterId}`,
      info: { requesterId, declinerId }
    })
  }

const onServerAccessRequestCreatedFactory =
  ({
    addStreamAccessRequestedActivity
  }: {
    addStreamAccessRequestedActivity: AddStreamAccessRequestedActivity
  }) =>
  async (payload: EventPayload<typeof AccessRequestEvents.Created>) => {
    const {
      request: { resourceId, requesterId }
    } = payload.payload
    if (!isStreamAccessRequest(payload.payload.request)) return
    if (!resourceId) return

    await addStreamAccessRequestedActivity({
      streamId: resourceId,
      requesterId
    })
  }

const onServerAccessRequestFinalizedFactory =
  ({
    addStreamAccessRequestDeclinedActivity
  }: {
    addStreamAccessRequestDeclinedActivity: AddStreamAccessRequestDeclinedActivity
  }) =>
  async (payload: EventPayload<typeof AccessRequestEvents.Finalized>) => {
    const {
      approved,
      finalizedBy,
      request: { resourceId, resourceType, requesterId }
    } = payload.payload
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

export const reportAccessRequestActivityFactory =
  (deps: { eventListen: EventBusListen; saveActivity: SaveActivity }) => () => {
    const addStreamAccessRequestedActivity =
      addStreamAccessRequestedActivityFactory(deps)
    const addStreamAccessRequestDeclinedActivity =
      addStreamAccessRequestDeclinedActivityFactory(deps)
    const onServerAccessRequestCreated = onServerAccessRequestCreatedFactory({
      addStreamAccessRequestedActivity
    })
    const onServerAccessRequestFinalized = onServerAccessRequestFinalizedFactory({
      addStreamAccessRequestDeclinedActivity
    })

    const quitters = [
      deps.eventListen(AccessRequestEvents.Created, async (payload) => {
        if (!isStreamAccessRequest(payload.payload.request)) return
        return await onServerAccessRequestCreated(payload)
      }),
      deps.eventListen(AccessRequestEvents.Finalized, async (payload) => {
        if (!isStreamAccessRequest(payload.payload.request)) return
        await onServerAccessRequestFinalized(payload)
      })
    ]

    return () => quitters.forEach((quit) => quit())
  }
