import { db } from '@/db/knex'
import type { Resolvers } from '@/modules/core/graph/generated/graphql'
import { parseNotificationToLatestVersion } from '@/modules/notifications/helpers/toLatestVersion'
import {
  deleteUserNotificationsFactory,
  getUserNotificationsCountFactory,
  getUserNotificationsFactory,
  updateUserNotificationFactory
} from '@/modules/notifications/repositories/userNotification'
import { asOperation } from '@/modules/shared/command'
import { chunk } from 'lodash-es'

const getUserNotifications = getUserNotificationsFactory({ db })
const deleteUserNotifications = deleteUserNotificationsFactory({ db })
const updateUserNotification = updateUserNotificationFactory({ db })
const getUserNotificationsCount = getUserNotificationsCountFactory({ db })

const resolvers: Resolvers = {
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
        items: items.map(parseNotificationToLatestVersion)
      }
    }
  },
  Mutation: {
    notificationMutations: () => ({})
  },
  NotificationMutations: {
    async bulkDelete(_parent, { ids }, context) {
      await asOperation(
        async () => {
          await deleteUserNotifications({
            userId: context.userId!,
            ids
          })
        },
        {
          logger: context.log,
          name: 'userNotificationPreferencesUpdate',
          description: 'deleting user notifications'
        }
      )

      return true
    },
    async bulkUpdate(_parent, args, context) {
      await asOperation(
        async () => {
          const inputBatches = chunk(args.input, 10)
          for (const batch of inputBatches) {
            await Promise.all(
              batch.map(({ id, read }) => {
                let update = {}
                if (read === false) {
                  update = {
                    read: false,
                    sendEmailAt: null
                  }
                } else {
                  update = {
                    read: true
                  }
                }

                return updateUserNotification({
                  userId: context.userId!,
                  id,
                  update
                })
              })
            )
          }
        },
        {
          logger: context.log,
          name: 'userNotificationPreferencesUpdate',
          description: 'marking user notifications as read'
        }
      )

      return true
    }
  }
}

export default resolvers
