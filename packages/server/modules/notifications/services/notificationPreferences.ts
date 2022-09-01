import { getUserNotificationPreferences, saveUserNotificationPreferences } from '@/modules/notifications/repositories'
import {
  NotificationChannel,
  NotificationType,
  NotificationPreferences
} from '@/modules/notifications/helpers/types'

export async function userNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  const savedPreferences = await getUserNotificationPreferences(userId)
  return addDefaultPreferenceValues(savedPreferences)
}

export function addDefaultPreferenceValues(
  preferences: NotificationPreferences
): NotificationPreferences {
  const savedPreferences = { ...preferences }

  Object.values(NotificationType).forEach((nt) => {
    const notificationTypeSettings = savedPreferences[nt] ?? {}

    Object.values(NotificationChannel).forEach((nc) => {
      notificationTypeSettings[nc] = notificationTypeSettings[nc] ?? true
    })
    savedPreferences[nt] = notificationTypeSettings
  })
  return savedPreferences
}

export async function updateNotificationPreferences(
  userId: string,
  rawPreferences: unknown
): Promise<void> {
  // lets do some nested attribute copying, to sanitize the input
  const preferences = rawPreferences as NotificationPreferences
  return await saveUserNotificationPreferences(userId, preferences)
}
