import { Logger } from '@/logging/logging'
import { AccessRequestEvents } from '@/modules/accessrequests/domain/events'
import {
  AccessRequestType,
  isStreamAccessRequest
} from '@/modules/accessrequests/repositories'
import {
  AddStreamAccessRequestDeclinedActivity,
  AddStreamAccessRequestedActivity,
  AddStreamInviteSentOutActivity
} from '@/modules/activitystream/domain/operations'
import { GetStream } from '@/modules/core/domain/streams/operations'
import {
  ServerInvitesEvents,
  ServerInvitesEventsPayloads
} from '@/modules/serverinvites/domain/events'
import {
  isProjectResourceTarget,
  resolveTarget
} from '@/modules/serverinvites/helpers/core'
import { EventPayload } from '@/modules/shared/services/eventBus'

export const onServerAccessRequestCreatedFactory =
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

export const onServerAccessRequestFinalizedFactory =
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

export const onServerInviteCreatedFactory =
  ({
    getStream,
    logger,
    addStreamInviteSentOutActivity
  }: {
    getStream: GetStream
    logger: Logger
    addStreamInviteSentOutActivity: AddStreamInviteSentOutActivity
  }) =>
  async (payload: ServerInvitesEventsPayloads[typeof ServerInvitesEvents.Created]) => {
    const { invite } = payload
    const primaryResourceTarget = invite.resource

    if (!isProjectResourceTarget(primaryResourceTarget)) return

    const userTarget = resolveTarget(invite.target)
    const project = await getStream({ streamId: primaryResourceTarget.resourceId })
    if (!project) {
      logger.warn('No project found for project invite', { invite })
      return
    }

    await addStreamInviteSentOutActivity({
      streamId: project.id,
      inviterId: invite.inviterId,
      inviteTargetEmail: userTarget.userEmail,
      inviteTargetId: userTarget.userId,
      stream: project
    })
  }
