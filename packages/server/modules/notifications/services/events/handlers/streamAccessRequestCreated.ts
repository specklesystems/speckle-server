import {
  AccessRequestType,
  getPendingAccessRequestFactory
} from '@/modules/accessrequests/repositories'
import { NotificationValidationError } from '@/modules/notifications/errors'
import { Roles } from '@/modules/core/helpers/mainConstants'
import { sendEmail } from '@/modules/emails/services/sending'
import { renderEmail } from '@/modules/emails/services/emailRendering'
import { db } from '@/db/knex'
import type { GetPendingAccessRequest } from '@/modules/accessrequests/domain/operations'
import type {
  GetStream,
  GetStreamCollaborators
} from '@/modules/core/domain/streams/operations'
import {
  getStreamCollaboratorsFactory,
  getStreamFactory
} from '@/modules/core/repositories/streams'
import type { GetUser } from '@/modules/core/domain/users/operations'
import { getUserFactory } from '@/modules/core/repositories/users'
import type { GetServerInfo } from '@/modules/core/domain/server/operations'
import { getServerInfoFactory } from '@/modules/core/repositories/server'
import type { EventBusPayloads, EventType } from '@/modules/shared/services/eventBus'
import type { StoreUserNotifications } from '@/modules/notifications/domain/operations'
import type { UserNotificationRecord } from '@/modules/notifications/helpers/types'
import { NotificationType } from '@/modules/notifications/helpers/types'
import cryptoRandomString from 'crypto-random-string'
import { storeUserNotificationsFactory } from '@/modules/notifications/repositories/userNotification'

type ValidateMessageDeps = {
  getPendingAccessRequest: GetPendingAccessRequest
  getUser: GetUser
  getStream: GetStream
  getStreamCollaborators: GetStreamCollaborators
}

const validateMessageFactory =
  (deps: ValidateMessageDeps) =>
  async ({ payload }: { payload: EventBusPayloads['accessrequests.created'] }) => {
    const {
      request: { id: requestId, resourceId: streamId }
    } = payload

    if (!streamId) throw new NotificationValidationError('No stream ID provided')

    const stream = await deps.getStream({ streamId })
    if (!stream) throw new NotificationValidationError('Nonexistant stream')

    const request = await deps.getPendingAccessRequest(
      requestId,
      AccessRequestType.Stream
    )
    if (!request)
      throw new NotificationValidationError('Nonexistant stream access request')

    const owners = await deps.getStreamCollaborators(streamId, Roles.Stream.Owner)
    if (!owners.length) throw new NotificationValidationError('Stream has no owners')

    const requester = await deps.getUser(request.requesterId)
    if (!requester)
      throw new NotificationValidationError(
        'User who made the request no longer exists'
      )

    const targetUsers = []
    for (const owner of owners) {
      const [user, streamWithRole] = await Promise.all([
        deps.getUser(owner.id),
        deps.getStream({
          streamId: request.resourceId,
          userId: owner.id
        })
      ])

      if (!user) throw new NotificationValidationError('User no longer exists')
      if (!streamWithRole) throw new NotificationValidationError('Nonexistant stream')
      if (streamWithRole.role !== Roles.Stream.Owner)
        throw new NotificationValidationError(
          'Only stream owners can receive notifications about stream access requests'
        )

      targetUsers.push(user)
    }

    return {
      request,
      stream,
      targetUsers,
      requester
    }
  }

const streamAccessRequestCreatedHandlerFactory =
  (
    deps: {
      getServerInfo: GetServerInfo
      renderEmail: typeof renderEmail
      sendEmail: typeof sendEmail
      saveUserNotifications: StoreUserNotifications
    } & ValidateMessageDeps
  ) =>
  async (event: EventType<'accessrequests.created'>) => {
    const state = await validateMessageFactory(deps)(event)
    const now = new Date()
    const notifications: UserNotificationRecord[] = []
    for (const targetUser of state.targetUsers) {
      notifications.push({
        id: cryptoRandomString({ length: 10 }),
        userId: targetUser.id,
        type: NotificationType.NewStreamAccessRequest,
        read: false,
        payload: {
          streamId: state.stream.id,
          requesterId: state.requester.id
        },
        sendEmailAt: now,
        createdAt: now,
        updatedAt: now
      })
    }
    await deps.saveUserNotifications(notifications)
  }

export const handler = (event: EventType<'accessrequests.created'>) => {
  const streamAccessRequestCreatedHandler = streamAccessRequestCreatedHandlerFactory({
    getServerInfo: getServerInfoFactory({ db }),
    renderEmail,
    sendEmail,
    getUser: getUserFactory({ db }),
    getStream: getStreamFactory({ db }),
    getPendingAccessRequest: getPendingAccessRequestFactory({ db }),
    getStreamCollaborators: getStreamCollaboratorsFactory({ db }),
    saveUserNotifications: storeUserNotificationsFactory({ db })
  })
  return streamAccessRequestCreatedHandler(event)
}

export default handler
