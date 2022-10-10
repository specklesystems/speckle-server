import {
  NotificationPublisher,
  NotificationTypeMessageMap
} from '@/modules/notifications/helpers/types'
import { publishMessage } from '@/modules/notifications/services/queue'

/**
 * Publish a notification
 */
export const publishNotification: NotificationPublisher = async (type, params) => {
  const msg = {
    type,
    ...params
  } as NotificationTypeMessageMap[typeof type]

  return await publishMessage(msg)
}
