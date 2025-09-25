import type {
  NotificationChannel,
  NotificationPreferences,
  NotificationType,
  UserNotificationRecord
} from '@/modules/notifications/helpers/types'
import type { MaybeNullOrUndefined } from '@speckle/shared'

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
}) => Promise<{ items: UserNotificationRecord[]; cursor: string | null }>

export type GetUserNotificationsCount = (args: { userId: string }) => Promise<number>

export type GetNextEmailNotification = () => Promise<
  MaybeNullOrUndefined<UserNotificationRecord>
>

export type MarkCommentNotificationAsRead = (args: {
  userId: string
  commentId: string
}) => Promise<void>

export type DeleteUserNotifications = (args: {
  userId: string
  ids: string[]
}) => Promise<void>

export type StoreUserNotifications = (
  notifications: UserNotificationRecord[]
) => Promise<void>

export type UpdateUserNotifications = (args: {
  ids: string[]
  userId: string
  update: Partial<Omit<UserNotificationRecord, 'id' | 'createdAt'>>
}) => Promise<void>
