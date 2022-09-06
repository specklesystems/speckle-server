import {
  NotificationType,
  NotificationTypeMessageMap
} from '@/modules/notifications/helpers/types'
import { publishMessage } from '@/modules/notifications/services/queue'

/**
 * Publish a notification
 */
export async function publishNotification<T extends NotificationType>(
  type: T,
  params: Omit<NotificationTypeMessageMap[T], 'type'>
) {
  const msg = {
    type,
    ...params
  } as NotificationTypeMessageMap[T]

  return await publishMessage(msg)
}
