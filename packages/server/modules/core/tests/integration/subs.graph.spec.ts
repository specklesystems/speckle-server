import {
  BasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { BasicTestUser, createTestUser } from '@/test/authHelper'
import {
  OnUserProjectsUpdatedDocument,
  OnUserProjectVersionsUpdatedDocument,
  OnUserStreamAddedDocument,
  OnUserStreamCommitCreatedDocument,
  UserProjectsUpdatedMessageType
} from '@/test/graphql/generated/graphql'
import {
  TestApolloSubscriptionClient,
  testApolloSubscriptionServer,
  TestApolloSubscriptionServer
} from '@/test/graphqlHelper'
import { beforeEachContext, getMainTestRegionKey } from '@/test/hooks'
import { BasicTestCommit, createTestCommit } from '@/test/speckle-helpers/commitHelper'
import {
  isMultiRegionTestMode,
  waitForRegionUser
} from '@/test/speckle-helpers/regions'
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

  const modes = [
    { isMultiRegion: false },
    ...(isMultiRegionTestMode() ? [{ isMultiRegion: true }] : [])
  ]

  modes.forEach(({ isMultiRegion }) => {
    describe(`W/${!isMultiRegion ? 'o' : ''} multiregion`, () => {
      const myMainWorkspace: BasicTestWorkspace = {
        id: '',
        ownerId: '',
        slug: '',
        name: 'My Main Workspace'
      }

      before(async () => {
        await createTestWorkspace(myMainWorkspace, me, {
          regionKey: isMultiRegion ? getMainTestRegionKey() : undefined
        })
        if (isMultiRegion) {
          await Promise.all([
            waitForRegionUser({ userId: me.id }),
            waitForRegionUser({ userId: otherGuy.id })
          ])
        }
      })

      describe('Project Subs', () => {
        it('should notify me of a new project (userProjectsUpdated/userStreamAdded)', async () => {
          const onUserProjectsUpdated = await meSubClient.subscribe(
            OnUserProjectsUpdatedDocument,
            {},
            (res) => {
              expect(res).to.not.haveGraphQLErrors()
              expect(res.data?.userProjectsUpdated.type).to.equal(
                UserProjectsUpdatedMessageType.Added
              )
              expect(res.data?.userProjectsUpdated.project?.name).to.equal(myProj.name)
            }
          )
          const onUserStreamAdded = await meSubClient.subscribe(
            OnUserStreamAddedDocument,
            {},
            (res) => {
              expect(res).to.not.haveGraphQLErrors()
              expect(res.data?.userStreamAdded?.name).to.equal(myProj.name)
            }
          )
          await meSubClient.waitForReadiness()

          const myProj: BasicTestStream = {
            name: 'My New Test1 Project',
            id: '',
            ownerId: me.id,
            isPublic: true,
            workspaceId: myMainWorkspace.id
          }
          const otherGuysProj: BasicTestStream = {
            name: 'Other Guys Project',
            id: '',
            ownerId: otherGuy.id,
            isPublic: true,
            workspaceId: myMainWorkspace.id
          }
          await createTestStreams([
            [myProj, me],
            [otherGuysProj, otherGuy]
          ])
          await Promise.all([
            onUserProjectsUpdated.waitForMessage(),
            onUserStreamAdded.waitForMessage()
          ])

          expect(onUserProjectsUpdated.getMessages()).to.have.length(1)
          expect(onUserStreamAdded.getMessages()).to.have.length(1)
        })
      })

      describe('Version Subs', () => {
        const myVersionProj: BasicTestStream = {
          name: 'My New Version Project #1',
          id: '',
          ownerId: '',
          isPublic: true,
          workspaceId: myMainWorkspace.id
        }

        before(async () => {
          await createTestStreams([[myVersionProj, me]])
        })

        it(`should notify me of a new version (userProjectVersionsUpdated)`, async () => {
          const message = 'ayyyooo'
          const onUserProjectVersionsUpdated = await meSubClient.subscribe(
            OnUserProjectVersionsUpdatedDocument,
            { projectId: myVersionProj.id },
            (res) => {
              expect(res).to.not.haveGraphQLErrors()
              expect(res.data?.projectVersionsUpdated.version?.message).to.equal(
                message
              )
            }
          )
          const onUserStreamCommitCreated = await meSubClient.subscribe(
            OnUserStreamCommitCreatedDocument,
            { streamId: myVersionProj.id },
            (res) => {
              expect(res).to.not.haveGraphQLErrors()
              expect(res.data?.commitCreated?.message).to.equal(message)
            }
          )
          await meSubClient.waitForReadiness()

          // Create test commit
          const commit: BasicTestCommit = {
            streamId: '',
            objectId: '',
            id: '',
            authorId: '',
            message
          }
          await createTestCommit(commit, { owner: me, stream: myVersionProj })

          await Promise.all([
            onUserProjectVersionsUpdated.waitForMessage(),
            onUserStreamCommitCreated.waitForMessage()
          ])

          expect(onUserProjectVersionsUpdated.getMessages()).to.have.length(1)
          expect(onUserStreamCommitCreated.getMessages()).to.have.length(1)
        })
      })
    })
  })
})
