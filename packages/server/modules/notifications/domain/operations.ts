import { NotificationPreferences } from '@/modules/notifications/helpers/types'

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
