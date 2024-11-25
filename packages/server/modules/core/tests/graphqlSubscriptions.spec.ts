import { BasicTestUser, createTestUser } from '@/test/authHelper'
import {
  OnUserProjectsUpdatedDocument,
  UserProjectsUpdatedMessageType
} from '@/test/graphql/generated/graphql'
import {
  TestApolloSubscriptionClient,
  testApolloSubscriptionServer,
  TestApolloSubscriptionServer
} from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { BasicTestStream, createTestStreams } from '@/test/speckle-helpers/streamHelper'
import { expect } from 'chai'

describe('Core GraphQL Subscriptions (New)', () => {
  let me: BasicTestUser
  let otherGuy: BasicTestUser
  let subServer: TestApolloSubscriptionServer
  let meSubClient: TestApolloSubscriptionClient

  before(async () => {
    await beforeEachContext()
    me = await createTestUser()
    otherGuy = await createTestUser()
    subServer = await testApolloSubscriptionServer()
    meSubClient = await subServer.buildClient({ authUserId: me.id })
  })

  after(async () => {
    subServer.quit()
  })

  describe('Project Subs', () => {
    it('should notify me of a new project (userProjectsUpdated)', async () => {
      let notifications = 0
      const { waitForMessage } = await meSubClient.subscribe(
        OnUserProjectsUpdatedDocument,
        {},
        (res) => {
          expect(res).to.not.haveGraphQLErrors()
          expect(res.data?.userProjectsUpdated.type).to.equal(
            UserProjectsUpdatedMessageType.Added
          )
          expect(res.data?.userProjectsUpdated.project?.name).to.equal(myProj.name)
          notifications++
        }
      )
      await meSubClient.waitForReadiness()

      const myProj: BasicTestStream = {
        name: 'My New Test1 Project',
        id: '',
        ownerId: me.id,
        isPublic: true
      }
      const otherGuysProj: BasicTestStream = {
        name: 'Other Guys Project',
        id: '',
        ownerId: otherGuy.id,
        isPublic: true
      }
      await createTestStreams([
        [myProj, me],
        [otherGuysProj, otherGuy]
      ])
      await waitForMessage()

      expect(notifications).to.equal(1)
    })
  })
})
