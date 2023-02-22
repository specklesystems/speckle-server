import { UserNotificationPreferences } from '@/modules/core/dbSchema'
import { NotificationPreferences } from '@/modules/notifications/helpers/types'

export async function getUserNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  const userPreferences = await UserNotificationPreferences.knex()
    .where({ userId })
    .first('*')
  return userPreferences?.preferences ?? {}
}

export async function saveUserNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences
): Promise<void> {
  await UserNotificationPreferences.knex()
    .insert({ userId, preferences })
    .onConflict('userId')
    .merge()
}
