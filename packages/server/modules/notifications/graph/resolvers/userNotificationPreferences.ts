import { User } from '@/modules/core/graph/generated/graphql'
import {
  userNotificationPreferences,
  updateNotificationPreferences
} from '@/modules/notifications/services/notificationPreferences'
// import { Resolvers } from '@/modules/notifications/graph/generated/graphql'

module.exports = {
  User: {
    async notificationPreferences(parent: User) {
      // does this need any access control?
      const preferences = await userNotificationPreferences(parent.id)
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
}
