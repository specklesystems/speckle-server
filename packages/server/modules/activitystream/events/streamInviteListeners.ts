import { SaveActivity } from '@/modules/activitystream/domain/operations'
import { ActionTypes, ResourceTypes } from '@/modules/activitystream/helpers/types'
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
    saveActivity: SaveActivity
    getProjectInviteProject: GetProjectInviteProject
  }) =>
  async (payload: EventPayload<typeof ServerInvitesEvents.Created>) => {
    const { invite } = payload.payload
    const project = await deps.getProjectInviteProject({ invite })
    if (!project) return

    const userTarget = resolveTarget(invite.target)
    const targetDisplay = userTarget.userId || userTarget.userEmail

    await deps.saveActivity({
      streamId: project.id,
      resourceType: ResourceTypes.Stream,
      resourceId: project.id,
      actionType: ActionTypes.Stream.InviteSent,
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
    saveActivity: SaveActivity
    getProjectInviteProject: GetProjectInviteProject
  }) =>
  async (payload: EventPayload<typeof ServerInvitesEvents.Finalized>) => {
    const { invite } = payload.payload
    const project = await deps.getProjectInviteProject({ invite })
    if (!project) return

    const userTarget = resolveTarget(invite.target)
    const role =
      getResourceTypeRole(invite.resource, ProjectInviteResourceType) ||
      Roles.Stream.Contributor

    await deps.saveActivity({
      streamId: project.id,
      resourceType: ResourceTypes.Stream,
      resourceId: project.id,
      actionType: ActionTypes.Stream.InviteAccepted,
      userId: userTarget.userId!,
      info: { inviterUser: invite.inviterId, role },
      message: `User ${userTarget.userId!} has accepted an invitation to become a ${role}`
    })
  }

/**
 * Save "user declined an invite" activity item
 */
const addStreamInviteDeclinedActivityFactory =
  (deps: {
    saveActivity: SaveActivity
    getProjectInviteProject: GetProjectInviteProject
  }) =>
  async (payload: EventPayload<typeof ServerInvitesEvents.Finalized>) => {
    const { invite } = payload.payload
    const project = await deps.getProjectInviteProject({ invite })
    if (!project) return

    const userTarget = resolveTarget(invite.target)
    await deps.saveActivity({
      streamId: project.id,
      resourceType: ResourceTypes.Stream,
      resourceId: project.id,
      actionType: ActionTypes.Stream.InviteDeclined,
      userId: userTarget.userId!,
      message: `User ${userTarget!} declined to join the stream ${project.id}`,
      info: { targetId: userTarget!, inviterId: invite.inviterId }
    })
  }

export const reportStreamInviteActivityFactory =
  (deps: {
    eventListen: EventBusListen
    saveActivity: SaveActivity
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
