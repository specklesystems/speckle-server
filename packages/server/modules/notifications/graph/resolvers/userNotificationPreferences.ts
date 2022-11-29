import { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  updateNotificationPreferences,
  getUserNotificationPreferences
} from '@/modules/notifications/services/notificationPreferences'

module.exports = {
  User: {
    async notificationPreferences(parent) {
      const preferences = await getUserNotificationPreferences(parent.id)
      return preferences
    }
  },
  Mutation: {
    async userNotificationPreferencesUpdate(
      _parent,
      args,
      context: { userId: string }
    ) {
      await updateNotificationPreferences(context.userId, args.preferences)
      return true
    }
  }
} as Resolvers
