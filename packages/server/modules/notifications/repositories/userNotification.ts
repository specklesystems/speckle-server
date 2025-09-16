import { UserNotifications } from '@/modules/core/dbSchema'
import type {
  GetUserNotifications,
  SaveUserNotifications
} from '@/modules/notifications/domain/operations'
import type { UserNotificationRecord } from '@/modules/notifications/helpers/types'
import type { Knex } from 'knex'

const tables = {
  userNotifications: (db: Knex) => db<UserNotificationRecord>(UserNotifications.name)
}

export const getUserNotifications =
  (deps: { db: Knex }): GetUserNotifications =>
  async (userId: string): Promise<Array<UserNotificationRecord>> => {
    const notifications = await tables.userNotifications(deps.db).where({ userId })

    return notifications
  }

export const saveUserNotificationsFactory =
  (deps: { db: Knex }): SaveUserNotifications =>
  async (notifications: Array<UserNotificationRecord>): Promise<void> => {
    await tables.userNotifications(deps.db).insert(notifications)
  }
