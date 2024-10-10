import {
  AddStreamAccessRequestedActivity,
  SaveActivity
} from '@/modules/activitystream/domain/operations'
import { ActionTypes, ResourceTypes } from '@/modules/activitystream/helpers/types'

/**
 * Save a "stream access requested" activity
 */
export const addStreamAccessRequestedActivityFactory =
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
export const addStreamAccessRequestDeclinedActivityFactory =
  ({ saveActivity }: { saveActivity: SaveActivity }) =>
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
