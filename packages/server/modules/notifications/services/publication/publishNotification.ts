import type {
  NotificationPublisher,
  NotificationTypeMessageMap
} from '@/modules/notifications/helpers/types'
import { publishMessage } from '@/modules/notifications/services/publication/queue'
import { isNotificationListenerEnabled } from '@/modules/shared/helpers/envHelper'

/**
 * Publish a notification
 * @deprecated new implementations should be built using the notificationListener handlers
 */
export const publishNotification: NotificationPublisher = async (type, params) => {
  const msg = {
    type,
    ...params
  } as NotificationTypeMessageMap[typeof type]

  // return is only consumed by specs
  // this satisfies ts
  if (isNotificationListenerEnabled()) return -1

  return await publishMessage(msg)
}
