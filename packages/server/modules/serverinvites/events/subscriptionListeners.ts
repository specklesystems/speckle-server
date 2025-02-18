import {
  ProjectUpdatedMessageType,
  UserProjectsUpdatedMessageType
} from '@/modules/core/graph/generated/graphql'
import { ServerInvitesEvents } from '@/modules/serverinvites/domain/events'
import { resolveTarget } from '@/modules/serverinvites/helpers/core'
import { GetProjectInviteProject } from '@/modules/serverinvites/services/operations'
import { StreamPubsubEvents } from '@/modules/shared'
import { DependenciesOf } from '@/modules/shared/helpers/factory'
import { EventBusListen, EventPayload } from '@/modules/shared/services/eventBus'
import {
  ProjectSubscriptions,
  PublishSubscription,
  UserSubscriptions
} from '@/modules/shared/utils/subscriptions'

const reportProjectInviteCreatedFactory =
  (deps: {
    publish: PublishSubscription
    getProjectInviteProject: GetProjectInviteProject
  }) =>
  async (payload: EventPayload<typeof ServerInvitesEvents.Created>) => {
    const { invite } = payload.payload
    const project = await deps.getProjectInviteProject({ invite })
    if (!project) return

    await deps.publish(ProjectSubscriptions.ProjectUpdated, {
      projectUpdated: {
        id: project.id,
        type: ProjectUpdatedMessageType.Updated,
        project
      }
    })
  }

const reportProjectInviteFinalizedFactory =
  (deps: {
    publish: PublishSubscription
    getProjectInviteProject: GetProjectInviteProject
  }) =>
  async (payload: EventPayload<typeof ServerInvitesEvents.Finalized>) => {
    const { invite, accept } = payload.payload
    const project = await deps.getProjectInviteProject({ invite })
    if (!project) return

    const userTarget = resolveTarget(invite.target)
    if (accept) {
      await Promise.all([
        deps.publish(StreamPubsubEvents.UserStreamAdded, {
          userStreamAdded: {
            id: project.id,
            sharedBy: invite.inviterId
          },
          ownerId: userTarget.userId!
        }),
        deps.publish(UserSubscriptions.UserProjectsUpdated, {
          userProjectsUpdated: {
            id: project.id,
            type: UserProjectsUpdatedMessageType.Added,
            project
          },
          ownerId: userTarget.userId!
        }),
        deps.publish(ProjectSubscriptions.ProjectUpdated, {
          projectUpdated: {
            id: project.id,
            type: ProjectUpdatedMessageType.Updated,
            project
          }
        })
      ])
    } else {
      await deps.publish(ProjectSubscriptions.ProjectUpdated, {
        projectUpdated: {
          id: project.id,
          type: ProjectUpdatedMessageType.Updated,
          project
        }
      })
    }
  }

export const reportSubscriptionEventsFactory =
  (
    deps: {
      eventListen: EventBusListen
      publish: PublishSubscription
    } & DependenciesOf<typeof reportProjectInviteCreatedFactory> &
      DependenciesOf<typeof reportProjectInviteFinalizedFactory>
  ) =>
  () => {
    const reportProjectInviteCreated = reportProjectInviteCreatedFactory(deps)
    const reportProjectInviteFinalized = reportProjectInviteFinalizedFactory(deps)

    const quitCbs = [
      deps.eventListen(ServerInvitesEvents.Created, reportProjectInviteCreated),
      deps.eventListen(ServerInvitesEvents.Finalized, reportProjectInviteFinalized)
    ]

    return () => quitCbs.forEach((quit) => quit())
  }
