import { db } from '@/db/knex'
import { type UserNotificationRecord } from '@/modules/notifications/helpers/types'
import { NotificationType } from '@speckle/shared/notifications'
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
      version: '1',
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
