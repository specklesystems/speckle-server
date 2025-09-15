import { db } from '@/db/knex'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  getSavedUserNotificationPreferencesFactory,
  saveUserNotificationPreferencesFactory
} from '@/modules/notifications/repositories/userNotificationPreferences'
import {
  getUserNotificationPreferencesFactory,
  updateNotificationPreferencesFactory
} from '@/modules/notifications/services/notificationPreferences'
import { withOperationLogging } from '@/observability/domain/businessLogging'

const getUserNotificationPreferences = getUserNotificationPreferencesFactory({
  getSavedUserNotificationPreferences: getSavedUserNotificationPreferencesFactory({
    db
  })
})

const updateNotificationPreferences = updateNotificationPreferencesFactory({
  saveUserNotificationPreferences: saveUserNotificationPreferencesFactory({ db })
})

export default {
  User: {
    async notificationPreferences(parent) {
      const preferences = await getUserNotificationPreferences(parent.id)
      return preferences
    }
  },
  Mutation: {
    async userNotificationPreferencesUpdate(_parent, args, context) {
      const logger = context.log
      await await withOperationLogging(
        async () => updateNotificationPreferences(context.userId!, args.preferences),
        {
          logger,
          operationName: 'userNotificationPreferencesUpdate',
          operationDescription: 'Update user notification preferences'
        }
      )
      return true
    }
  }
} as Resolvers
