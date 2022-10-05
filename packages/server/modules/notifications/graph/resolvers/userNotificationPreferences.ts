import { Resolvers, User } from '@/modules/core/graph/generated/graphql'
import {
  updateNotificationPreferences,
  getUserNotificationPreferences
} from '@/modules/notifications/services/notificationPreferences'

module.exports = {
  User: {
    async notificationPreferences(parent: User) {
      // does this need any access control?
      const preferences = await getUserNotificationPreferences(parent.id)
      return preferences
    }
  },
  Mutation: {
    async userNotificationPreferencesUpdate(
      _parent: unknown,
      args: { preferences: Record<string, unknown> },
      context: { userId: string }
    ) {
      await updateNotificationPreferences(context.userId, args.preferences)
      return true
    }
  }
} as Resolvers
