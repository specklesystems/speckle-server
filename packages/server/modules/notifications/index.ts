import {
  initializeQueue,
  consumeIncomingNotifications,
  registerNotificationHandlers,
  shutdownQueue
} from '@/modules/notifications/services/queue'
import {
  NotificationType,
  NotificationTypeHandlers
} from '@/modules/notifications/helpers/types'
import { modulesDebug } from '@/modules/shared/utils/logger'
import { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { shouldDisableNotificationsConsumption } from '@/modules/shared/helpers/envHelper'

export async function initializeConsumption(
  customHandlers?: Partial<NotificationTypeHandlers>
) {
  modulesDebug('📞 Initializing notification queue consumption...')

  const allHandlers: Partial<NotificationTypeHandlers> = {
    [NotificationType.MentionedInComment]: (
      await import('@/modules/notifications/services/handlers/mentionedInComment')
    ).default,
    [NotificationType.ActivityDigest]: (
      await import('@/modules/notifications/services/handlers/activityDigest')
    ).default
  }

  registerNotificationHandlers(customHandlers || allHandlers)

  initializeQueue()

  if (shouldDisableNotificationsConsumption()) {
    modulesDebug('Skipping notification consumption...')
  } else {
    await consumeIncomingNotifications()
  }
}

export const init: SpeckleModule['init'] = async (_, isInitial) => {
  modulesDebug('📞 Init notifications module')
  if (isInitial) {
    await initializeConsumption()
  }
}

export const shutdown: SpeckleModule['shutdown'] = async () => {
  await shutdownQueue()
}
