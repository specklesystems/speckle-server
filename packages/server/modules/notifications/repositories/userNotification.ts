import { UserNotifications } from '@/modules/core/dbSchema'
import type {
  DeleteUserNotifications,
  GetNextEmailNotification,
  GetUserNotifications,
  GetUserNotificationsCount,
  StoreUserNotifications,
  UpdateUserNotifications
} from '@/modules/notifications/domain/operations'
import type { UserNotificationRecord } from '@/modules/notifications/helpers/types'
import {
  decodeIsoDateCursor,
  encodeIsoDateCursor
} from '@/modules/shared/helpers/dbHelper'
import { isNullOrUndefined } from '@speckle/shared'
import { type Knex } from 'knex'
import { clamp } from 'lodash-es'

const tables = {
  userNotifications: (db: Knex) => db<UserNotificationRecord>(UserNotifications.name)
}

export const getUserNotificationsFactory =
  (deps: { db: Knex }): GetUserNotifications =>
  async (args) => {
    if (args.limit === 0) return { items: [], cursor: null }

    const cursor = args.cursor ? decodeIsoDateCursor(args.cursor) : null
    const limit = clamp(isNullOrUndefined(args.limit) ? 10 : args.limit, 0, 50)

    const q = tables
      .userNotifications(deps.db)
      .where({ userId: args.userId })
      .orderBy(UserNotifications.col.createdAt, 'desc')
      .limit(limit)

    if (cursor) q.andWhere(UserNotifications.col.createdAt, '<', cursor)

    const items = await q
    return {
      items,
      cursor:
        items.length === limit
          ? encodeIsoDateCursor(items[items.length - 1].createdAt)
          : null
    }
  }

export const getUserNotificationsCountFactory =
  (deps: { db: Knex }): GetUserNotificationsCount =>
  async ({ userId }) => {
    const [res] = await tables.userNotifications(deps.db).where({ userId }).count()

    return parseInt(res.count.toString())
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

export const getNextEmailNotificationFactory =
  (deps: { db: Knex }): GetNextEmailNotification =>
  async () => {
    const notification = await tables
      .userNotifications(deps.db)
      .where(UserNotifications.col.sendEmailAt, '<=', new Date())
      .andWhere(UserNotifications.col.read, false)
      .forUpdate()
      .skipLocked()
      .first()

    return notification
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
