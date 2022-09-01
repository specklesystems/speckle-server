import knex from '@/db/knex'
import { NotificationPreferences } from '@/modules/notifications/helpers/types'

const TABLE_NAME = 'user_notification_preferences'

export async function getUserNotificationPreferences(
  userId: string
): Promise<NotificationPreferences> {
  const { preferences } = await knex(TABLE_NAME).where({ userId }).first('*')
  return preferences ?? {}
}

export async function saveUserNotificationPreferences(
  userId: string,
  preferences: NotificationPreferences
): Promise<void> {
  await knex(TABLE_NAME).insert({ userId, preferences }).onConflict('userId').merge()
}
