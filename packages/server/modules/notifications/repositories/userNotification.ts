import { UserNotifications } from '@/modules/core/dbSchema'
import type {
  DeleteUserNotifications,
  GetEmailNotifications,
  GetUserNotifications,
  StoreUserNotifications,
  UpdateUserNotifications
} from '@/modules/notifications/domain/operations'
import type { UserNotificationRecord } from '@/modules/notifications/helpers/types'
import { type Knex } from 'knex'

const tables = {
  userNotifications: (db: Knex) => db<UserNotificationRecord>(UserNotifications.name)
}

export const getUserNotificationsFactory =
  (deps: { db: Knex }): GetUserNotifications =>
  async ({ userId }): Promise<Array<UserNotificationRecord>> => {
    const notifications = await tables
      .userNotifications(deps.db)
      .where({ userId })
      .orderBy(UserNotifications.col.createdAt, 'desc')

    return notifications
  }

export const storeUserNotificationsFactory =
  (deps: { db: Knex }): StoreUserNotifications =>
  async (notifications: Array<UserNotificationRecord>) => {
    await deps.db(UserNotifications.name).insert(notifications)
  }

export const updateUserNotificationsFactory =
  (deps: { db: Knex }): UpdateUserNotifications =>
  async ({ userId, ids, update }) => {
    await deps
      .db(UserNotifications.name)
      .where({ userId })
      .whereIn(UserNotifications.col.id, ids)
      .update(update)
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

export const deleteUserNotificationsFactory =
  (deps: { db: Knex }): DeleteUserNotifications =>
  async ({ userId, ids }) => {
    await tables
      .userNotifications(deps.db)
      .where({ userId })
      .whereIn(UserNotifications.col.id, ids)
      .delete()
  }
