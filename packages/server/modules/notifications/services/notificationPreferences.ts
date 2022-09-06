import * as repo from '@/modules/notifications/repositories'
import {
  NotificationChannel,
  NotificationType,
  NotificationPreferences
} from '@/modules/notifications/helpers/types'
import { InvalidArgumentError } from '@/modules/shared/errors'

export async function getUserNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  const savedPreferences = await repo.getUserNotificationPreferences(userId)
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
  rawPreferences: Record<string, unknown>
): Promise<void> {
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
  return await repo.saveUserNotificationPreferences(userId, parsedPreferences)
}
