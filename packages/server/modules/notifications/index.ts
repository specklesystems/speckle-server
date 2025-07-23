import {
  initializeQueue,
  consumeIncomingNotifications,
  registerNotificationHandlers,
  shutdownQueue
} from '@/modules/notifications/services/queue'
import type { NotificationTypeHandlers } from '@/modules/notifications/helpers/types'
import { NotificationType } from '@/modules/notifications/helpers/types'
import type { SpeckleModule } from '@/modules/shared/helpers/typeHelper'
import { shouldDisableNotificationsConsumption } from '@/modules/shared/helpers/envHelper'
import { moduleLogger } from '@/observability/logging'
import MentionedInCommentHandler from '@/modules/notifications/services/handlers/mentionedInComment'
import NewStreamAccessRequestHandler from '@/modules/notifications/services/handlers/newStreamAccessRequest'
import StreamAccessRequestApprovedHandler from '@/modules/notifications/services/handlers/streamAccessRequestApproved'
import ActivityDigestHandler from '@/modules/notifications/services/handlers/activityDigest'

export async function initializeConsumption(
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

  await initializeQueue()

  if (shouldDisableNotificationsConsumption()) {
    moduleLogger.info('Skipping notification consumption...')
  } else {
    await consumeIncomingNotifications()
  }
}

export const init: SpeckleModule['init'] = async ({ isInitial }) => {
  moduleLogger.info('📞 Init notifications module')
  if (isInitial) {
    await initializeConsumption()
  }
}

export const shutdown: SpeckleModule['shutdown'] = async () => {
  await shutdownQueue()
}
