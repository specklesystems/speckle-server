import { Logger } from '@/logging/logging'
import { AddStreamInviteSentOutActivity } from '@/modules/activitystream/domain/operations'
import { GetStream } from '@/modules/core/domain/streams/operations'
import {
  ServerInvitesEvents,
  ServerInvitesEventsPayloads
} from '@/modules/serverinvites/domain/events'
import {
  isProjectResourceTarget,
  resolveTarget
} from '@/modules/serverinvites/helpers/core'

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
