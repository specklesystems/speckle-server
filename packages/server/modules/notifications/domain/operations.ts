import type {
  NotificationPreferences,
  UserNotificationRecord
} from '@/modules/notifications/helpers/types'

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

export type GetUserNotifications = (args: {
  userId: string
  cursor: string | null
  limit: number | null
}) => Promise<{ items: UserNotificationRecord[]; cursor: string | null }>

export type GetUserNotificationsCount = (args: { userId: string }) => Promise<number>

export type GetEmailNotifications = () => Promise<UserNotificationRecord[]>

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
