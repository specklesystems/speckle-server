import { moduleLogger } from '@/logging/logging'
import {
  NotificationType,
  NotificationTypeHandlers
} from '@/modules/notifications/helpers/types'
import {
  consumeIncomingNotifications,
  initializeQueue,
  registerNotificationHandlers,
  shutdownQueue
} from '@/modules/notifications/services/queue'
import { shouldDisableNotificationsConsumption } from '@/modules/shared/helpers/envHelper'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'

export async function initializeConsumption(
  customHandlers?: Partial<NotificationTypeHandlers>
) {
  moduleLogger.info('📞 Initializing notification queue consumption...')

  const allHandlers: Partial<NotificationTypeHandlers> = {
    [NotificationType.MentionedInComment]: (
      await import('@/modules/notifications/services/handlers/mentionedInComment')
    ).default,
    [NotificationType.NewStreamAccessRequest]: (
      await import('@/modules/notifications/services/handlers/newStreamAccessRequest')
    ).default,
    [NotificationType.StreamAccessRequestApproved]: (
      await import(
        '@/modules/notifications/services/handlers/streamAccessRequestApproved'
      )
    ).default,
    [NotificationType.ActivityDigest]: (
      await import('@/modules/notifications/services/handlers/activityDigest')
    ).default
  }

  registerNotificationHandlers(customHandlers || allHandlers)

  initializeQueue()

  if (shouldDisableNotificationsConsumption()) {
    moduleLogger.info('Skipping notification consumption...')
  } else {
    await consumeIncomingNotifications()
  }
}

export const init: SpeckleModule['init'] = async (_, isInitial) => {
  moduleLogger.info('📞 Init notifications module')
  if (isInitial) {
    await initializeConsumption()
  }
}

export const shutdown: SpeckleModule['shutdown'] = async () => {
  await shutdownQueue()
}
