import type {
  BaseUserNotification,
  NotificationChannel,
  NotificationPreferences,
  UserNotificationRecord
} from '@/modules/notifications/helpers/types'
import type { MaybeNullOrUndefined } from '@speckle/shared'
import type { NotificationType } from '@speckle/shared/notifications'
import type { Exact } from 'type-fest'

export type GetSavedUserNotificationPreferences = (
  userId: string
) => Promise<NotificationPreferences>

export type SaveUserNotificationPreferences = (
  userId: string,
  preferences: NotificationPreferences
) => Promise<void>

export type GetUserNotificationPreferences = (
  userId: string
) => Promise<NotificationPreferences>

export type GetUserPreferenceForNotificationType = (
  userId: string,
  notificationType: NotificationType,
  notificationChannel: NotificationChannel
) => Promise<boolean>

export type GetUserNotifications = (args: {
  userId: string
  cursor: string | null
  limit: number | null
}) => Promise<{ items: BaseUserNotification[]; cursor: string | null }>

export type GetUserNotificationsCount = (args: { userId: string }) => Promise<number>

export type GetNextEmailNotification = () => Promise<
  MaybeNullOrUndefined<BaseUserNotification>
>

export type MarkCommentNotificationAsRead = (args: {
  userId: string
  commentId: string
}) => Promise<number>

export type DeleteUserNotifications = (args: {
  userId: string
  ids: string[]
}) => Promise<void>

export type StoreUserNotifications = <
  Notification extends Exact<UserNotificationRecord, Notification>
>(
  notifications: Notification[]
) => Promise<number>

export type UpdateUserNotification = (args: {
  id: string
  userId: string
  update: Partial<Omit<UserNotificationRecord, 'id' | 'createdAt'>>
}) => Promise<UserNotificationRecord>
