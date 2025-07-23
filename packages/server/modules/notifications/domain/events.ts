import type { NotificationMessage } from '@/modules/notifications/helpers/types'

export const notificationsEventNamespace = 'notifications' as const

export const NotificationsEvents = {
  Received: `${notificationsEventNamespace}.received`
} as const

export type NotificationsEvents =
  (typeof NotificationsEvents)[keyof typeof NotificationsEvents]

export type NotificationsEventsPayloads = {
  [NotificationsEvents.Received]: {
    message: NotificationMessage
  }
}
