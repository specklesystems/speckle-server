import { db } from '@/db/knex'
import { getDefaultRegionFactory } from '@/modules/workspaces/repositories/regions'
import { createWorkspaceProjectFactory } from '@/modules/workspaces/services/projects'
import {
  BasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { itEach } from '@/test/assertionHelper'
import { BasicTestUser, createTestUser } from '@/test/authHelper'
import {
  OnWorkspaceProjectsUpdatedDocument,
  WorkspaceProjectsUpdatedMessageType
} from '@/test/graphql/generated/graphql'
import {
  TestApolloSubscriptionClient,
  testApolloSubscriptionServer,
  TestApolloSubscriptionServer
} from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import {
  getMainTestRegionKey,
  isMultiRegionTestMode,
  waitForRegionUser
} from '@/test/speckle-helpers/regions'
import { faker } from '@faker-js/faker'
import { expect } from 'chai'

enum WorkspaceIdentification {
  WithId = 'with id',
  WithSlug = 'with slug'
}

const createWorkspaceProject = createWorkspaceProjectFactory({
  getDefaultRegion: getDefaultRegionFactory({ db })
})

describe('Workspace GQL Subscriptions', () => {
  let me: BasicTestUser
  let subServer: TestApolloSubscriptionServer
  let meSubClient: TestApolloSubscriptionClient

  before(async () => {
    await beforeEachContext()
    me = await createTestUser()
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
          await waitForRegionUser({ userId: me.id })
        }
      })

      itEach(
        [WorkspaceIdentification.WithId, WorkspaceIdentification.WithSlug],
        (idType) => `sub ${idType} and notify when a project is added to the workspace`,
        async (idType) => {
          const sub = await meSubClient.subscribe(
            OnWorkspaceProjectsUpdatedDocument,
            {
              workspaceId:
                idType === WorkspaceIdentification.WithId
                  ? myMainWorkspace.id
                  : undefined,
              workspaceSlug:
                idType === WorkspaceIdentification.WithSlug
                  ? myMainWorkspace.slug
                  : undefined
            },
            (res) => {
              expect(res).to.not.haveGraphQLErrors()
              expect(res.data?.workspaceProjectsUpdated.type).to.equal(
                WorkspaceProjectsUpdatedMessageType.Added
              )
            }
          )
          await meSubClient.waitForReadiness()

          await createWorkspaceProject({
            input: {
              workspaceId: myMainWorkspace.id,
              name: 'New Workspace Project ' + faker.number.int()
            },
            ownerId: me.id
          })

          await sub.waitForMessage()
          expect(sub.getMessages()).to.have.length(1)
        }
      )
    })
  })
})
