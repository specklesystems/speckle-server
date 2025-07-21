import { SaveStreamActivity } from '@/modules/activitystream/domain/operations'
import {
  StreamActionTypes,
  StreamResourceTypes
} from '@/modules/activitystream/helpers/types'
import { ProjectInviteResourceType } from '@/modules/serverinvites/domain/constants'
import { ServerInvitesEvents } from '@/modules/serverinvites/domain/events'
import {
  getResourceTypeRole,
  resolveTarget
} from '@/modules/serverinvites/helpers/core'
import { GetProjectInviteProject } from '@/modules/serverinvites/services/operations'
import { EventBusListen, EventPayload } from '@/modules/shared/services/eventBus'
import { Roles } from '@speckle/shared'

/**
 * Save "user invited another user to stream" activity item
 */
const addStreamInviteSentOutActivityFactory =
  (deps: {
    saveStreamActivity: SaveStreamActivity
    getProjectInviteProject: GetProjectInviteProject
  }) =>
  async (payload: EventPayload<typeof ServerInvitesEvents.Created>) => {
    const { invite } = payload.payload
    const project = await deps.getProjectInviteProject({ invite })
    if (!project) return

    const userTarget = resolveTarget(invite.target)
    const targetDisplay = userTarget.userId || userTarget.userEmail

    await deps.saveStreamActivity({
      streamId: project.id,
      resourceType: StreamResourceTypes.Stream,
      resourceId: project.id,
      actionType: StreamActionTypes.Stream.InviteSent,
      userId: invite.inviterId,
      message: `User ${invite.inviterId} has invited ${targetDisplay} to stream ${project.id}`,
      info: {
        targetId: userTarget.userId || null,
        targetEmail: userTarget.userEmail || null
      }
    })
  }

/**
 * Save "user accepted stream invite" activity item
 */
const addStreamInviteAcceptedActivityFactory =
  (deps: {
    saveStreamActivity: SaveStreamActivity
    getProjectInviteProject: GetProjectInviteProject
  }) =>
  async (payload: EventPayload<typeof ServerInvitesEvents.Finalized>) => {
    const { invite, trueFinalizerUserId } = payload.payload
    const project = await deps.getProjectInviteProject({ invite })
    if (!project) return

    const userTarget = resolveTarget(invite.target)
    const role =
      getResourceTypeRole(invite.resource, ProjectInviteResourceType) ||
      Roles.Stream.Contributor

    const differentFinalizer = trueFinalizerUserId !== userTarget.userId

    await deps.saveStreamActivity({
      streamId: project.id,
      resourceType: StreamResourceTypes.Stream,
      resourceId: project.id,
      actionType: StreamActionTypes.Stream.InviteAccepted,
      userId: trueFinalizerUserId,
      info: { inviterUser: invite.inviterId, role, targetUserId: userTarget.userId! },
      message: differentFinalizer
        ? `User ${trueFinalizerUserId} has auto-accepted ${userTarget.userId!} invitation to become a ${role}`
        : `User ${userTarget.userId!} has accepted an invitation to become a ${role}`
    })
  }

/**
 * Save "user declined an invite" activity item
 */
const addStreamInviteDeclinedActivityFactory =
  (deps: {
    saveStreamActivity: SaveStreamActivity
    getProjectInviteProject: GetProjectInviteProject
  }) =>
  async (payload: EventPayload<typeof ServerInvitesEvents.Finalized>) => {
    const { invite } = payload.payload
    const project = await deps.getProjectInviteProject({ invite })
    if (!project) return

    const userTarget = resolveTarget(invite.target)
    await deps.saveStreamActivity({
      streamId: project.id,
      resourceType: StreamResourceTypes.Stream,
      resourceId: project.id,
      actionType: StreamActionTypes.Stream.InviteDeclined,
      userId: userTarget.userId!,
      message: `User ${userTarget.userId!} declined to join the stream ${project.id}`,
      info: { targetId: userTarget!, inviterId: invite.inviterId }
    })
  }

export const reportStreamInviteActivityFactory =
  (deps: {
    eventListen: EventBusListen
    saveStreamActivity: SaveStreamActivity
    getProjectInviteProject: GetProjectInviteProject
  }) =>
  () => {
    const addStreamInviteSentOutActivity = addStreamInviteSentOutActivityFactory(deps)
    const addStreamInviteAcceptedActivity = addStreamInviteAcceptedActivityFactory(deps)
    const addStreamInviteDeclinedActivity = addStreamInviteDeclinedActivityFactory(deps)

    const quitters = [
      deps.eventListen(ServerInvitesEvents.Created, addStreamInviteSentOutActivity),
      deps.eventListen(ServerInvitesEvents.Finalized, async (payload) => {
        if (payload.payload.accept) {
          await addStreamInviteAcceptedActivity(payload)
        } else {
          await addStreamInviteDeclinedActivity(payload)
        }
      })
    ]

    return () => {
      quitters.forEach((quit) => quit())
    }
  }
