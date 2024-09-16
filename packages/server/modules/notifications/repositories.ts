import { UserNotificationPreferences } from '@/modules/core/dbSchema'
import {
  GetSavedUserNotificationPreferences,
  SaveUserNotificationPreferences
} from '@/modules/notifications/domain/operations'
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

export const saveUserNotificationPreferencesFactory =
  (deps: { db: Knex }): SaveUserNotificationPreferences =>
  async (userId: string, preferences: NotificationPreferences): Promise<void> => {
    await tables
      .userNotificationPreferences(deps.db)
      .insert({ userId, preferences })
      .onConflict('userId')
      .merge()
  }
