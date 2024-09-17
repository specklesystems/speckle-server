import {
  NotificationChannel,
  NotificationType,
  NotificationPreferences
} from '@/modules/notifications/helpers/types'
import { InvalidArgumentError } from '@/modules/shared/errors'
import {
  GetSavedUserNotificationPreferences,
  GetUserNotificationPreferences,
  SaveUserNotificationPreferences
} from '@/modules/notifications/domain/operations'

export const getUserNotificationPreferencesFactory =
  (deps: {
    getSavedUserNotificationPreferences: GetSavedUserNotificationPreferences
  }): GetUserNotificationPreferences =>
  async (userId: string): Promise<NotificationPreferences> => {
    const savedPreferences = await deps.getSavedUserNotificationPreferences(userId)
    return addDefaultPreferenceValues(savedPreferences)
  }

function addDefaultPreferenceValues(
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

export const updateNotificationPreferencesFactory =
  (deps: { saveUserNotificationPreferences: SaveUserNotificationPreferences }) =>
  async (userId: string, rawPreferences: Record<string, unknown>): Promise<void> => {
    const parsedPreferences: NotificationPreferences = {}
    // lets do some nested attribute copying, to sanitize the input
    for (const key in rawPreferences) {
      if (!Object.values(NotificationType).includes(key as NotificationType))
        throw new InvalidArgumentError(
          `Notification preferences input contains an unknown setting: ${key}`
        )
      const nt = key as NotificationType
      const notificationTypePreferences: Partial<Record<NotificationChannel, boolean>> =
        {}
      const notificationTypeSettings = rawPreferences[nt] as Record<string, unknown>
      for (const ncKey in notificationTypeSettings) {
        if (!Object.values(NotificationChannel).includes(ncKey as NotificationChannel))
          throw new InvalidArgumentError(
            `Notification preferences input contains an unknown setting: ${ncKey}`
          )
        const nc = ncKey as NotificationChannel
        const preferenceValue = notificationTypeSettings[nc]
        if (typeof preferenceValue !== 'boolean')
          throw new InvalidArgumentError(
            `Notification preferences input contains and invalid value: ${preferenceValue}`
          )
        notificationTypePreferences[nc] = preferenceValue
      }
      parsedPreferences[nt] = notificationTypePreferences
    }
    return await deps.saveUserNotificationPreferences(userId, parsedPreferences)
  }
