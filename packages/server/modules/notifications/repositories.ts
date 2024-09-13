import { UserNotificationPreferences } from '@/modules/core/dbSchema'
import { GetSavedUserNotificationPreferences } from '@/modules/notifications/domain/operations'
import {
  NotificationPreferences,
  UserNotificationPreferencesRecord
} from '@/modules/notifications/helpers/types'
import { Knex } from 'knex'

const tables = {
  userNotificationPreferences: (db: Knex) =>
    db<UserNotificationPreferencesRecord>(UserNotificationPreferences.name)
}

export const getSavedUserNotificationPreferencesFactory =
  (deps: { db: Knex }): GetSavedUserNotificationPreferences =>
  async (userId: string): Promise<NotificationPreferences> => {
    const userPreferences = await tables
      .userNotificationPreferences(deps.db)
      .where({ userId })
      .first()

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
