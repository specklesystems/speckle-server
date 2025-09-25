import { db } from '@/db/knex'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import {
  deleteUserNotificationsFactory,
  getUserNotificationsCountFactory,
  getUserNotificationsFactory,
  updateUserNotificationsFactory
} from '@/modules/notifications/repositories/userNotification'
import { withOperationLogging } from '@/observability/domain/businessLogging'

const getUserNotifications = getUserNotificationsFactory({ db })
const deleteUserNotifications = deleteUserNotificationsFactory({ db })
const updateUserNotifications = updateUserNotificationsFactory({ db })
const getUserNotificationsCount = getUserNotificationsCountFactory({ db })

export default {
  User: {
    async notifications(parent, args) {
      const [totalCount, { items, cursor }] = await Promise.all([
        await getUserNotificationsCount({ userId: parent.id }),
        await getUserNotifications({
          userId: parent.id,
          cursor: args.cursor || null,
          limit: args.limit || null
        })
      ])
      return {
        totalCount,
        cursor,
        items
      }
    }
  },
  Mutation: {
    notificationMutations: () => ({})
  },
  NotificationMutations: {
    async bulkDelete(_parent, { ids }, context) {
      await withOperationLogging(
        async () => {
          await deleteUserNotifications({
            userId: context.userId!,
            ids
          })
        },
        {
          logger: context.log,
          operationName: 'userNotificationPreferencesUpdate',
          operationDescription: 'deleting user notifications'
        }
      )

      return true
    },
    async bulkUpdate(_parent, { ids, input }, context) {
      let update = {}
      if (input.read === false) {
        update = {
          read: false,
          sendEmailAt: null
        }
      } else {
        update = {
          read: true
        }
      }

      await withOperationLogging(
        async () => {
          await updateUserNotifications({
            userId: context.userId!,
            ids,
            update
          })
        },
        {
          logger: context.log,
          operationName: 'userNotificationPreferencesUpdate',
          operationDescription: 'marking user notifications as read'
        }
      )

      return true
    }
  }
} as Resolvers
