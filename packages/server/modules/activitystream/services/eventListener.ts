import { Logger } from '@/logging/logging'
import {
  AccessRequestsEvents,
  AccessRequestsEventsPayloads
} from '@/modules/accessrequests/events/emitter'
import {
  AccessRequestType,
  isStreamAccessRequest
} from '@/modules/accessrequests/repositories'
import {
  AddStreamAccessRequestDeclinedActivity,
  AddStreamAccessRequestedActivity,
  AddStreamInviteSentOutActivity,
  SaveActivity
} from '@/modules/activitystream/domain/operations'
import { GetStream } from '@/modules/core/domain/streams/operations'
import { UsersEvents, UsersEventsPayloads } from '@/modules/core/events/usersEmitter'
import {
  ServerInvitesEvents,
  ServerInvitesEventsPayloads
} from '@/modules/serverinvites/domain/events'
import {
  isProjectResourceTarget,
  resolveTarget
} from '@/modules/serverinvites/helpers/core'

export const onUserCreatedFactory =
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

export const onServerAccessRequestCreatedFactory =
  ({
    addStreamAccessRequestedActivity
  }: {
    addStreamAccessRequestedActivity: AddStreamAccessRequestedActivity
  }) =>
  async (payload: AccessRequestsEventsPayloads[AccessRequestsEvents.Created]) => {
    const {
      request: { resourceId, requesterId }
    } = payload
    if (!isStreamAccessRequest(payload.request)) return
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
