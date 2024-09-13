import { NotificationPreferences } from '@/modules/notifications/helpers/types'

export type GetSavedUserNotificationPreferences = (
  userId: string
) => Promise<NotificationPreferences>
