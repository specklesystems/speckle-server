import { InvalidNotificationError } from '@/modules/notifications/errors'
import {
  emitNotificationsEvent,
  NotificationsEvents
} from '@/modules/notifications/events/emitter'
import {
  NotificationType,
  NotificationTypeMessageMap
} from '@/modules/notifications/helpers/types'
import {
  publishMessage,
  NOTIFICATIONS_QUEUE
} from '@/modules/notifications/services/queue'
import { notificationsDebug } from '@/modules/shared/utils/logger'
import { Message } from 'redis-smq'

async function sendNotification<T extends NotificationType>(
  message: NotificationTypeMessageMap[T]
) {
  notificationsDebug(`Publishing notification of type '${message.type}'`)

  let body: string
  try {
    body = JSON.stringify(message)
  } catch (e) {
    throw new InvalidNotificationError(
      'Attempted to send unserializable notification',
      {
        info: {
          params: message
        }
      }
    )
  }

  const msg = new Message()
  msg.setBody(body)
  msg.setQueue(NOTIFICATIONS_QUEUE)
  msg.setConsumeTimeout(10000) // 10s
  msg.setTTL(1000 * 60 * 60 * 24) // 24h

  return await publishMessage(msg)
}

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

  const msgId = await sendNotification(msg)
  emitNotificationsEvent(NotificationsEvents.Published, { notification: msg })

  return msgId
}
