import {
  AccessRequestsEmitter,
  AccessRequestsEvents,
  AccessRequestsEventsPayloads
} from '@/modules/accessrequests/events/emitter'
import { isStreamAccessRequest } from '@/modules/accessrequests/repositories'
import { GetStreamCollaborators } from '@/modules/core/domain/streams/operations'
import { Roles } from '@/modules/core/helpers/mainConstants'
import {
  NotificationPublisher,
  NotificationType
} from '@/modules/notifications/helpers/types'

type OnServerAccessRequestCreatedDeps = {
  getStreamCollaborators: GetStreamCollaborators
  publishNotification: NotificationPublisher
}

const onServerAccessRequestCreatedFactory =
  (deps: OnServerAccessRequestCreatedDeps) =>
  async (payload: AccessRequestsEventsPayloads[AccessRequestsEvents.Created]) => {
    const { request } = payload

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
  async (payload: AccessRequestsEventsPayloads[AccessRequestsEvents.Finalized]) => {
    const { approved, request, finalizedBy } = payload

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
      accessRequestsEventListener: (typeof AccessRequestsEmitter)['listen']
    } & OnServerAccessRequestCreatedDeps &
      OnServerAccessRequestFinalizedDeps
  ) =>
  () => {
    const onServerAccessRequestCreated = onServerAccessRequestCreatedFactory(deps)
    const onServerAccessRequestFinalized = onServerAccessRequestFinalizedFactory(deps)

    const quitCbs = [
      deps.accessRequestsEventListener(
        AccessRequestsEvents.Created,
        onServerAccessRequestCreated
      ),
      deps.accessRequestsEventListener(
        AccessRequestsEvents.Finalized,
        onServerAccessRequestFinalized
      )
    ]

    return () => quitCbs.forEach((quit) => quit())
  }
