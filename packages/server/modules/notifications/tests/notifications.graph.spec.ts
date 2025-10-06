import { db } from '@/db/knex'
import { UserNotifications } from '@/modules/core/dbSchema'
import {
  GetUserNotificationsDocument,
  UserBulkDeleteNotidicationDocument,
  UserBulkUpdateNotificationsDocument
} from '@/modules/core/graph/generated/graphql'
import { getUserNotificationsFactory } from '@/modules/notifications/repositories/userNotification'
import {
  buildTestNotification,
  createTestNotification
} from '@/modules/notifications/tests/helpers'
import { isNotificationListenerEnabled } from '@/modules/shared/helpers/envHelper'
import type { BasicTestUser } from '@/test/authHelper'
import { createTestUser } from '@/test/authHelper'
import type { TestApolloServer } from '@/test/graphqlHelper'
import { testApolloServer } from '@/test/graphqlHelper'
import { beforeEachContext, truncateTables } from '@/test/hooks'
import { expect } from 'chai'
import { times } from 'lodash-es'

isNotificationListenerEnabled()
  ? describe('Notifications GQL', () => {
      let apollo: TestApolloServer
      let user: BasicTestUser
      let anotherUser: BasicTestUser

      before(async () => {
        await beforeEachContext()
        user = await createTestUser()
        anotherUser = await createTestUser()

        apollo = await testApolloServer({ authUserId: user.id })
      })

      beforeEach(async () => {
        await truncateTables([UserNotifications.name])
      })

      it('pulls only your notifications', async () => {
        await createTestNotification(
          buildTestNotification({
            userId: user.id
          })
        )
        await createTestNotification(
          buildTestNotification({
            userId: anotherUser.id
          })
        )
        await createTestNotification(
          buildTestNotification({
            userId: user.id
          })
        )

        const { data } = await apollo.execute(
          GetUserNotificationsDocument,
          {},
          { assertNoErrors: true }
        )

        expect(data?.activeUser?.notifications.items).to.have.lengthOf(2)
      })

      it('paginates your notifications', async () => {
        await Promise.all(
          times(50).map(async () =>
            createTestNotification(
              buildTestNotification({
                userId: user.id
              })
            )
          )
        )

        const { data } = await apollo.execute(
          GetUserNotificationsDocument,
          { limit: 10 },
          { assertNoErrors: true }
        )

        expect(data?.activeUser?.notifications.items).to.have.lengthOf(10)
        expect(data?.activeUser?.notifications.cursor).to.be.a('string')
        expect(data?.activeUser?.notifications.totalCount).to.be.eq(50)
      })

      it('allows deleting only your notifications', async () => {
        const n1 = await createTestNotification(
          buildTestNotification({
            userId: user.id
          })
        )
        const n2 = await createTestNotification(
          buildTestNotification({
            userId: anotherUser.id
          })
        )
        const n3 = await createTestNotification(
          buildTestNotification({
            userId: user.id
          })
        )

        await apollo.execute(
          UserBulkDeleteNotidicationDocument,
          {
            ids: [n1.id, n2.id, n3.id] // n2 shouldn't be deleted
          },
          { assertNoErrors: true }
        )
        const { data } = await apollo.execute(
          GetUserNotificationsDocument,
          {},
          { assertNoErrors: true }
        )
        const otherNotifications = await getUserNotificationsFactory({ db })({
          userId: anotherUser.id,
          cursor: null,
          limit: null
        })

        expect(data?.activeUser?.notifications.totalCount).to.be.equal(0)
        expect(data?.activeUser?.notifications.items).to.have.lengthOf(0)
        expect(otherNotifications.items).to.have.lengthOf(1)
      })

      it('allows updating read field in the notification', async () => {
        const n1 = await createTestNotification(
          buildTestNotification({
            userId: user.id,
            read: false
          })
        )
        const n2 = await createTestNotification(
          buildTestNotification({
            userId: anotherUser.id,
            read: false
          })
        )
        const n3 = await createTestNotification(
          buildTestNotification({
            userId: user.id,
            read: false
          })
        )

        await apollo.execute(
          UserBulkUpdateNotificationsDocument,
          {
            input: [
              {
                id: n1.id,
                read: true
              },
              {
                id: n2.id,
                read: true // n2 shouldn't be updated
              },
              {
                id: n3.id,
                read: true
              }
            ]
          },
          { assertNoErrors: true }
        )
        const { data } = await apollo.execute(
          GetUserNotificationsDocument,
          {},
          { assertNoErrors: true }
        )
        const otherNotifications = await getUserNotificationsFactory({ db })({
          userId: anotherUser.id,
          cursor: null,
          limit: null
        })

        expect(data?.activeUser?.notifications.items[0].read).to.be.true
        expect(data?.activeUser?.notifications.items[1].read).to.be.true
        expect(otherNotifications.items[0].read).to.be.false
      })
    })
  : {}
