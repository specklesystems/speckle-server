import {
  initializePublicationQueue,
  consumeIncomingNotifications,
  registerNotificationHandlers,
  shutdownPublicationQueue
} from '@/modules/notifications/services/publication/queue'
import type { NotificationTypeHandlers } from '@/modules/notifications/helpers/types'
import { NotificationType } from '@/modules/notifications/helpers/types'
import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { shouldDisableNotificationsConsumption } from '@/modules/shared/helpers/envHelper'
import { moduleLogger, notificationsLogger } from '@/observability/logging'
import MentionedInCommentHandler from '@/modules/notifications/services/publication/handlers/mentionedInComment'
import NewStreamAccessRequestHandler from '@/modules/notifications/services/publication/handlers/newStreamAccessRequest'
import StreamAccessRequestApprovedHandler from '@/modules/notifications/services/publication/handlers/streamAccessRequestApproved'
import ActivityDigestHandler from '@/modules/notifications/services/publication/handlers/activityDigest'
import {
  consumeEventNotifications,
  initializeNotificationEventsQueue,
  shutdownEventQueue
} from '@/modules/notifications/services/events/queue'
import { notificationListenersFactory } from '@/modules/notifications/events/notificationListener'
import { getEventBus } from '@/modules/shared/services/eventBus'

export async function initializePublicationConsumption(
  customHandlers?: Partial<NotificationTypeHandlers>
) {
  moduleLogger.info('📞 Initializing notification queue consumption...')

  const allHandlers: Partial<NotificationTypeHandlers> = {
    [NotificationType.MentionedInComment]: MentionedInCommentHandler,
    [NotificationType.NewStreamAccessRequest]: NewStreamAccessRequestHandler,
    [NotificationType.StreamAccessRequestApproved]: StreamAccessRequestApprovedHandler,
    [NotificationType.ActivityDigest]: ActivityDigestHandler
  }

  registerNotificationHandlers(customHandlers || allHandlers)

  await initializePublicationQueue()

  if (shouldDisableNotificationsConsumption()) {
    moduleLogger.info('Skipping notification consumption...')
  } else {
    await consumeIncomingNotifications()
  }
}

export const init: SpeckleModule['init'] = async ({ isInitial }) => {
  moduleLogger.info('📞 Init notifications module')
  if (isInitial) {
    await initializePublicationConsumption()
    await initializeNotificationEventsQueue()
    await consumeEventNotifications()
    notificationListenersFactory({
      eventBus: getEventBus(),
      logger: notificationsLogger
    })()
  }
}

export const shutdown: SpeckleModule['shutdown'] = async () => {
  await shutdownPublicationQueue()
  await shutdownEventQueue()
}
