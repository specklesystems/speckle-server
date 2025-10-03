import { db } from '@/db/knex'
import type { GetStream } from '@/modules/core/domain/streams/operations'
import type { GetUser } from '@/modules/core/domain/users/operations'
import { getStreamFactory } from '@/modules/core/repositories/streams'
import { getUserFactory } from '@/modules/core/repositories/users'
import type {
  GetUserPreferenceForNotificationType,
  StoreUserNotifications
} from '@/modules/notifications/domain/operations'
import { NotificationValidationError } from '@/modules/notifications/errors'
import { NotificationChannel } from '@/modules/notifications/helpers/types'
import { NotificationType } from '@speckle/shared/notifications'
import { storeUserNotificationsFactory } from '@/modules/notifications/repositories/userNotification'
import type { EventBusPayloads, EventType } from '@/modules/shared/services/eventBus'
import type { Nullable } from '@speckle/shared'
import cryptoRandomString from 'crypto-random-string'
import { getUserPreferenceForNotificationTypeFactory } from '@/modules/notifications/services/notificationPreferences'
import { getSavedUserNotificationPreferencesFactory } from '@/modules/notifications/repositories/userNotificationPreferences'

type ValidateMessageDeps = {
  getUser: GetUser
  getStream: GetStream
}

const validateEventFactory =
  (deps: ValidateMessageDeps) =>
  async ({
    targetUserId,
    resourceId,
    finalizedBy
  }: {
    targetUserId: string
    resourceId: Nullable<string>
    finalizedBy: string
  }) => {
    if (!resourceId) throw new NotificationValidationError('No stream provided')

    const [targetUser, finalizer, stream] = await Promise.all([
      deps.getUser(targetUserId),
      deps.getUser(finalizedBy),
      deps.getStream({ streamId: resourceId, userId: targetUserId })
    ])

    if (!targetUser)
      throw new NotificationValidationError('Invalid notification target user')
    if (!finalizer)
      throw new NotificationValidationError('Invalid notification finalizer')
    if (!stream) throw new NotificationValidationError('Invalid stream')
    if (!stream.role)
      throw new NotificationValidationError(
        'User doesnt appear to have a role on the stream'
      )

    return { targetUser, finalizer, stream }
  }

const steamAccessRequestFinalizedHandlerFactory =
  (
    deps: {
      saveUserNotifications: StoreUserNotifications
      getUserPreferenceForNotificationType: GetUserPreferenceForNotificationType
    } & ValidateMessageDeps
  ) =>
  async (args: {
    payload: EventBusPayloads['accessrequests.finalized'] // TODO: smarter typing
  }) => {
    const { approved, request, finalizedBy } = args.payload
    // notify only approvals
    if (!approved) return

    const state = await validateEventFactory(deps)({
      targetUserId: request.requesterId,
      resourceId: request.resourceId,
      finalizedBy
    })

    const isSubscribedToEmail = await deps.getUserPreferenceForNotificationType(
      state.targetUser.id,
      NotificationType.StreamAccessRequestApproved,
      NotificationChannel.Email
    )
    const now = new Date()
    await deps.saveUserNotifications([
      {
        id: cryptoRandomString({ length: 10 }),
        userId: state.targetUser.id,
        type: NotificationType.StreamAccessRequestApproved,
        read: false,
        version: '1',
        payload: {
          streamId: state.stream.id
        },
        sendEmailAt: isSubscribedToEmail ? now : null,
        createdAt: now,
        updatedAt: now
      }
    ])
  }

export const handler = async (event: EventType<'accessrequests.finalized'>) => {
  const steamAccessRequestFinalizedHandler = steamAccessRequestFinalizedHandlerFactory({
    getUser: getUserFactory({ db }),
    getStream: getStreamFactory({ db }),
    saveUserNotifications: storeUserNotificationsFactory({ db }),
    getUserPreferenceForNotificationType: getUserPreferenceForNotificationTypeFactory({
      getSavedUserNotificationPreferences: getSavedUserNotificationPreferencesFactory({
        db
      })
    })
  })
  return steamAccessRequestFinalizedHandler(event)
}

export default handler
