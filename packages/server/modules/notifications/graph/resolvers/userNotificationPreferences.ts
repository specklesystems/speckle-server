import { db } from '@/db/knex'
import { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  getSavedUserNotificationPreferencesFactory,
  saveUserNotificationPreferencesFactory
} from '@/modules/notifications/repositories'
import {
  getUserNotificationPreferencesFactory,
  updateNotificationPreferencesFactory
} from '@/modules/notifications/services/notificationPreferences'

const getUserNotificationPreferences = getUserNotificationPreferencesFactory({
  getSavedUserNotificationPreferences: getSavedUserNotificationPreferencesFactory({
    db
  })
})

const updateNotificationPreferences = updateNotificationPreferencesFactory({
  saveUserNotificationPreferences: saveUserNotificationPreferencesFactory({ db })
})

export = {
  User: {
    async notificationPreferences(parent) {
      const preferences = await getUserNotificationPreferences(parent.id)
      return preferences
    }
  },
  Mutation: {
    async userNotificationPreferencesUpdate(_parent, args, context) {
      await updateNotificationPreferences(context.userId!, args.preferences)
      return true
    }
  }
} as Resolvers
