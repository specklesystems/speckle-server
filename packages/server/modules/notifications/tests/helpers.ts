import { db } from '@/db/knex'
import {
  NotificationType,
  type UserNotificationRecord
} from '@/modules/notifications/helpers/types'
import { storeUserNotificationsFactory } from '@/modules/notifications/repositories/userNotification'
import cryptoRandomString from 'crypto-random-string'
import { assign } from 'lodash-es'

export const buildTestNotification = (
  overrides?: Partial<UserNotificationRecord>
): UserNotificationRecord =>
  assign(
    {
      id: cryptoRandomString({ length: 10 }),
      userId: cryptoRandomString({ length: 10 }),
      type: NotificationType.MentionedInComment,
      read: false,
      payload: {},
      sendEmailAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    overrides
  )

export const createTestNotification = async (
  notification?: UserNotificationRecord
): Promise<UserNotificationRecord> => {
  const storeUserNotifications = storeUserNotificationsFactory({ db })

  const storeNotification = notification || buildTestNotification()
  await storeUserNotifications([storeNotification])

  return storeNotification
}
