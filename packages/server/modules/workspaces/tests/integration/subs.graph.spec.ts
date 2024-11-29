import { db } from '@/db/knex'
import { ServerInvites } from '@/modules/core/dbSchema'
import { getEventBus } from '@/modules/shared/services/eventBus'
import { getDefaultRegionFactory } from '@/modules/workspaces/repositories/regions'
import {
  getWorkspaceBySlugFactory,
  getWorkspaceWithDomainsFactory,
  upsertWorkspaceFactory
} from '@/modules/workspaces/repositories/workspaces'
import {
  updateWorkspaceFactory,
  validateSlugFactory
} from '@/modules/workspaces/services/management'
import { createWorkspaceProjectFactory } from '@/modules/workspaces/services/projects'
import {
  BasicTestWorkspace,
  createTestWorkspace,
  unassignFromWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import {
  buildInvitesGraphqlOperations,
  TestInvitesGraphQLOperations
} from '@/modules/workspaces/tests/helpers/invites'
import { itEach } from '@/test/assertionHelper'
import { BasicTestUser, createTestUser } from '@/test/authHelper'
import {
  OnWorkspaceProjectsUpdatedDocument,
  OnWorkspaceUpdatedDocument,
  WorkspaceProjectsUpdatedMessageType
} from '@/test/graphql/generated/graphql'
import {
  testApolloServer,
  TestApolloServer,
  TestApolloSubscriptionClient,
  testApolloSubscriptionServer,
  TestApolloSubscriptionServer
} from '@/test/graphqlHelper'
import { beforeEachContext, truncateTables } from '@/test/hooks'
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

const updateWorkspace = updateWorkspaceFactory({
  validateSlug: validateSlugFactory({
    getWorkspaceBySlug: getWorkspaceBySlugFactory({ db })
  }),
  getWorkspace: getWorkspaceWithDomainsFactory({ db }),
  upsertWorkspace: upsertWorkspaceFactory({ db }),
  emitWorkspaceEvent: getEventBus().emit
})

describe('Workspace GQL Subscriptions', () => {
  let me: BasicTestUser
  let otherGuy: BasicTestUser
  let subServer: TestApolloSubscriptionServer
  let meSubClient: TestApolloSubscriptionClient
  let apollo: TestApolloServer
  let invitesHelpers: TestInvitesGraphQLOperations

  before(async () => {
    await beforeEachContext()
    me = await createTestUser()
    otherGuy = await createTestUser()
    subServer = await testApolloSubscriptionServer()
    meSubClient = await subServer.buildClient({ authUserId: me.id })
    apollo = await testApolloServer({ authUserId: me.id })
    invitesHelpers = buildInvitesGraphqlOperations({ apollo })
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

      itEach(
        [WorkspaceIdentification.WithId, WorkspaceIdentification.WithSlug],
        (idType) => `sub ${idType} and notify when a workspace is updated`,
        async (idType) => {
          const sub = await meSubClient.subscribe(
            OnWorkspaceUpdatedDocument,
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
              expect(res.data?.workspaceUpdated.id).to.equal(myMainWorkspace.id)
              expect(res.data?.workspaceUpdated.workspace.slug).to.equal(
                myMainWorkspace.slug
              )
            }
          )
          await meSubClient.waitForReadiness()

          await updateWorkspace({
            workspaceId: myMainWorkspace.id,
            workspaceInput: {
              name: 'Updated Workspace Name'
            }
          })

          await sub.waitForMessage()
          expect(sub.getMessages()).to.have.length(1)
        }
      )

      describe('team changes', () => {
        const myTeamWorkspace: BasicTestWorkspace = {
          id: '',
          ownerId: '',
          slug: '',
          name: 'My Team Workspace'
        }

        before(async () => {
          await createTestWorkspace(myTeamWorkspace, me, {
            regionKey: isMultiRegion ? getMainTestRegionKey() : undefined
          })
        })

        afterEach(async () => {
          await truncateTables([ServerInvites.name])
          await unassignFromWorkspace(myTeamWorkspace, otherGuy)
        })

        itEach(
          [WorkspaceIdentification.WithId, WorkspaceIdentification.WithSlug],
          (idType) => `sub ${idType} and notify when a workspace has a new invite`,
          async (idType) => {
            const sub = await meSubClient.subscribe(
              OnWorkspaceUpdatedDocument,
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
                expect(res.data?.workspaceUpdated.id).to.equal(myMainWorkspace.id)
                expect(res.data?.workspaceUpdated.workspace.slug).to.equal(
                  myMainWorkspace.slug
                )
              }
            )
            await meSubClient.waitForReadiness()

            // Invite user to workspace
            await invitesHelpers.createInvite(
              {
                workspaceId: myMainWorkspace.id,
                input: {
                  userId: otherGuy.id
                }
              },
              { assertNoErrors: true }
            )

            await sub.waitForMessage()
            expect(sub.getMessages()).to.have.length(1)
          }
        )
      })
    })
  })
})
