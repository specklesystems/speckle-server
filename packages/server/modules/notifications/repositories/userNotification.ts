import { UserNotifications } from '@/modules/core/dbSchema'
import type {
  GetEmailNotifications,
  GetUserNotifications,
  StoreUserNotifications,
  UpdateUserNotification
} from '@/modules/notifications/domain/operations'
import type { UserNotificationRecord } from '@/modules/notifications/helpers/types'
import { type Knex } from 'knex'

const tables = {
  userNotifications: (db: Knex) => db<UserNotificationRecord>(UserNotifications.name)
}

export const getUserNotifications =
  (deps: { db: Knex }): GetUserNotifications =>
  async (userId: string): Promise<Array<UserNotificationRecord>> => {
    const notifications = await tables.userNotifications(deps.db).where({ userId })

    return notifications
  }

export const storeUserNotificationsFactory =
  (deps: { db: Knex }): StoreUserNotifications =>
  async (notifications: Array<UserNotificationRecord>) => {
    await deps.db(UserNotifications.name).insert(notifications)
  }

export const updateUserNotificationFactory =
  (deps: { db: Knex }): UpdateUserNotification =>
  async (id, update) => {
    await deps.db(UserNotifications.name).where({ id }).update(update)
  }

export const getEmailNotificationsFactory =
  (deps: { db: Knex }): GetEmailNotifications =>
  async () => {
    const notifications = await tables
      .userNotifications(deps.db)
      .where(UserNotifications.col.sendEmailAt, '<=', new Date())
      .andWhere(UserNotifications.col.read, false)

    return notifications
  }
