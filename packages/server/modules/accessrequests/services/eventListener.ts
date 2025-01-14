import { AccessRequestEvents } from '@/modules/accessrequests/domain/events'
import { isStreamAccessRequest } from '@/modules/accessrequests/repositories'
import { GetStreamCollaborators } from '@/modules/core/domain/streams/operations'
import { Roles } from '@/modules/core/helpers/mainConstants'
import {
  NotificationPublisher,
  NotificationType
} from '@/modules/notifications/helpers/types'
import { EventBus, EventPayload } from '@/modules/shared/services/eventBus'

type OnServerAccessRequestCreatedDeps = {
  getStreamCollaborators: GetStreamCollaborators
  publishNotification: NotificationPublisher
}

const onServerAccessRequestCreatedFactory =
  (deps: OnServerAccessRequestCreatedDeps) =>
  async (payload: EventPayload<typeof AccessRequestEvents.Created>) => {
    const { request } = payload.payload

    // Send out email to all owners of the stream
    if (isStreamAccessRequest(request)) {
      const owners = await deps.getStreamCollaborators(
        request.resourceId,
        Roles.Stream.Owner
      )
      await Promise.all(
        owners.map((o) =>
          deps.publishNotification(NotificationType.NewStreamAccessRequest, {
            targetUserId: o.id,
            data: {
              requestId: request.id
            }
          })
        )
      )
    }
  }

type OnServerAccessRequestFinalizedDeps = {
  publishNotification: NotificationPublisher
}

const onServerAccessRequestFinalizedFactory =
  (deps: OnServerAccessRequestFinalizedDeps) =>
  async (payload: EventPayload<typeof AccessRequestEvents.Finalized>) => {
    const { approved, request, finalizedBy } = payload.payload

    // Send out email to requester, if accepted
    if (approved && isStreamAccessRequest(request)) {
      await deps.publishNotification(NotificationType.StreamAccessRequestApproved, {
        targetUserId: request.requesterId,
        data: {
          request,
          finalizedBy
        }
      })
    }
  }

/**
 * Initialize event listener for tracking various Speckle events
 */
export const initializeEventListenerFactory =
  (
    deps: {
      eventBus: EventBus
    } & OnServerAccessRequestCreatedDeps &
      OnServerAccessRequestFinalizedDeps
  ) =>
  () => {
    const onServerAccessRequestCreated = onServerAccessRequestCreatedFactory(deps)
    const onServerAccessRequestFinalized = onServerAccessRequestFinalizedFactory(deps)

    const quitCbs = [
      deps.eventBus.listen(AccessRequestEvents.Created, onServerAccessRequestCreated),
      deps.eventBus.listen(
        AccessRequestEvents.Finalized,
        onServerAccessRequestFinalized
      )
    ]

    return () => quitCbs.forEach((quit) => quit())
  }
