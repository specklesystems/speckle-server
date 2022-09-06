import {
  AccessRequestsEmitter,
  AccessRequestsEvents,
  AccessRequestsEventsPayloads
} from '@/modules/accessrequests/events/emitter'
import { isStreamAccessRequest } from '@/modules/accessrequests/repositories'
import { Roles } from '@/modules/core/helpers/mainConstants'
import { getStreamCollaborators } from '@/modules/core/repositories/streams'
import { NotificationType } from '@/modules/notifications/helpers/types'
import { publishNotification } from '@/modules/notifications/services/publication'

async function onServerAccessRequestCreated(
  payload: AccessRequestsEventsPayloads[AccessRequestsEvents.Created]
) {
  const { request } = payload

  // Send out email to all owners of the stream
  if (isStreamAccessRequest(request)) {
    const owners = await getStreamCollaborators(request.resourceId, Roles.Stream.Owner)
    await Promise.all(
      owners.map((o) =>
        publishNotification(NotificationType.NewStreamAccessRequest, {
          targetUserId: o.id,
          data: {
            requestId: request.id
          }
        })
      )
    )
  }
}

async function onServerAccessRequestFinalized(
  payload: AccessRequestsEventsPayloads[AccessRequestsEvents.Finalized]
) {
  const { approved, request, finalizedBy } = payload

  // Send out email to requester, if accepted
  if (approved && isStreamAccessRequest(request)) {
    await publishNotification(NotificationType.StreamAccessRequestApproved, {
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
export function initializeEventListener() {
  const quitCbs = [
    AccessRequestsEmitter.listen(
      AccessRequestsEvents.Created,
      onServerAccessRequestCreated
    ),
    AccessRequestsEmitter.listen(
      AccessRequestsEvents.Finalized,
      onServerAccessRequestFinalized
    )
  ]

  return () => quitCbs.forEach((quit) => quit())
}
