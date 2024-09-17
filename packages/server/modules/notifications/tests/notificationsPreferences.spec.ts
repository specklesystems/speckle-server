import { truncateTables } from '@/test/hooks'
import { UserNotificationPreferences, Users } from '@/modules/core/dbSchema'
import { BasicTestUser, createTestUsers } from '@/test/authHelper'
import { expect } from 'chai'
import {
  NotificationType,
  NotificationChannel
} from '@/modules/notifications/helpers/types'
import { BaseError } from '@/modules/shared/errors'
import {
  getUserNotificationPreferencesFactory,
  updateNotificationPreferencesFactory
} from '@/modules/notifications/services/notificationPreferences'
import {
  getSavedUserNotificationPreferencesFactory,
  saveUserNotificationPreferencesFactory
} from '@/modules/notifications/repositories'
import { db } from '@/db/knex'

const getSavedUserNotificationPreferences = getSavedUserNotificationPreferencesFactory({
  db
})
const getUserNotificationPreferences = getUserNotificationPreferencesFactory({
  getSavedUserNotificationPreferences
})
const updateNotificationPreferences = updateNotificationPreferencesFactory({
  saveUserNotificationPreferences: saveUserNotificationPreferencesFactory({ db })
})

const cleanup = async () => {
  await truncateTables([Users.name, UserNotificationPreferences.name])
}

describe('User notification preferences @notifications', () => {
  const userA: BasicTestUser = {
    name: 'd1',
    email: 'd.1@speckle.systems',
    id: ''
  }

  before(async () => {
    await cleanup()
    await createTestUsers([userA])
  })

  describe('services', () => {
    it('gets default preferences if none saved', async () => {
      const savedPreferences = await getSavedUserNotificationPreferences(userA.id)
      expect(savedPreferences).to.deep.equal({})
      expect(savedPreferences).to.be.empty
      const preferences = await getUserNotificationPreferences(userA.id)
      expect(preferences).to.not.be.empty
      for (const val of Object.values(preferences)) {
        for (const setting of Object.values(val)) {
          expect(setting).to.be.true
        }
      }
    })
    it('store notification settings', async () => {
      await updateNotificationPreferences(userA.id, {
        activityDigest: { email: false }
      })
      let preferences = await getUserNotificationPreferences(userA.id)
      expect(preferences).to.not.be.empty
      expect(preferences.activityDigest?.email).to.be.false
      await updateNotificationPreferences(userA.id, {
        activityDigest: { email: true }
      })
      preferences = await getUserNotificationPreferences(userA.id)
      expect(preferences.activityDigest?.email).to.be.true
    })
    it("doesn't store invalid preference keys", async () => {
      const invalidKeys = <const>[
        [NotificationType.ActivityDigest, 'mailPigeon', true],
        ['birthdayParty', NotificationChannel.Email, false],
        [
          NotificationType.MentionedInComment,
          NotificationChannel.Email,
          'PleaseDontSpamMe'
        ]
      ]
      for (const [nt, nc, value] of invalidKeys) {
        try {
          const preferences: Partial<Record<string, Partial<Record<string, boolean>>>> =
            {}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          preferences[nt] = {}
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          preferences[nt][nc] = value
          await updateNotificationPreferences(userA.id, preferences)
        } catch (err) {
          expect(err instanceof BaseError)
          const error = err as BaseError
          expect(error.message).to.contain('Notification preferences input')
        }
      }
    })
  })
})
