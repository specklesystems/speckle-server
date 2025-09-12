import type {
  NotificationPublisher,
  NotificationTypeMessageMap
} from '@/modules/notifications/helpers/types'
import { publishMessage } from '@/modules/notifications/services/publicationQueue'
import { isNotificationListenerEnabled } from '@/modules/shared/helpers/envHelper'

/**
 * Publish a notification
 */
export const publishNotification: NotificationPublisher = async (type, params) => {
  const msg = {
    type,
    ...params
  } as NotificationTypeMessageMap[typeof type]

  // return is only consumed by specs
  // this satisfies ty
  if (isNotificationListenerEnabled()) return -1

  return await publishMessage(msg)
}
