import { db } from '@/db/knex'
import { isMultiRegionEnabled } from '@/modules/multiregion/helpers'
import { storeRegionFactory } from '@/modules/multiregion/repositories'
import { WorkspaceRegions } from '@/modules/workspaces/repositories/regions'
import {
  assignToWorkspace,
  BasicTestWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import { BasicTestUser, createTestUser } from '@/test/authHelper'
import {
  GetWorkspaceAvailableRegionsDocument,
  GetWorkspaceDefaultRegionDocument,
  SetWorkspaceDefaultRegionDocument
} from '@/test/graphql/generated/graphql'
import { testApolloServer, TestApolloServer } from '@/test/graphqlHelper'
import { beforeEachContext, getRegionKeys } from '@/test/hooks'
import { MultiRegionDbSelectorMock } from '@/test/mocks/global'
import { truncateRegionsSafely } from '@/test/speckle-helpers/regions'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'

const storeRegion = storeRegionFactory({ db })
const isEnabled = isMultiRegionEnabled()

isEnabled
  ? describe('Workspace regions GQL', () => {
      const region1Key = 'us-west-1'
      const region2Key = 'eu-west-2'

      let me: BasicTestUser
      let otherGuy: BasicTestUser

      const myFirstWorkspace: BasicTestWorkspace = {
        id: '',
        ownerId: '',
        slug: '',
        name: 'My first workspace'
      }

      let apollo: TestApolloServer

      before(async () => {
        MultiRegionDbSelectorMock.mockFunction('getDb', async () => db)
        MultiRegionDbSelectorMock.mockFunction('getRegionDb', async () => db)

        await beforeEachContext()

        me = await createTestUser({ role: Roles.Server.Admin })
        otherGuy = await createTestUser({ role: Roles.Server.User })

        await Promise.all([
          // Create first test workspace
          createTestWorkspace(myFirstWorkspace, me),
          // Create a couple of test regions
          storeRegion({
            region: {
              key: region1Key,
              name: 'US West 1'
            }
          }),
          storeRegion({
            region: {
              key: region2Key,
              name: 'EU West 2'
            }
          })
        ])

        await Promise.all([
          // Make otherGuy member of my workspace
          assignToWorkspace(myFirstWorkspace, otherGuy)
        ])

        apollo = await testApolloServer({ authUserId: me.id })
      })

      after(async () => {
        MultiRegionDbSelectorMock.resetMockedFunctions()
        await truncateRegionsSafely()
      })

      describe('when listing', () => {
        it("can't list if not workspace admin", async () => {
          const res = await apollo.execute(
            GetWorkspaceAvailableRegionsDocument,
            { workspaceId: myFirstWorkspace.id },
            { authUserId: otherGuy.id }
          )

          expect(res.data?.workspace.availableRegions).to.be.not.ok
          expect(res).to.haveGraphQLErrors('You are not authorized')
        })

        it('can list if workspace admin', async () => {
          const res = await apollo.execute(GetWorkspaceAvailableRegionsDocument, {
            workspaceId: myFirstWorkspace.id
          })

          expect(res).to.not.haveGraphQLErrors()
          expect(
            res.data?.workspace.availableRegions.map((r) => r.key)
          ).to.deep.equalInAnyOrder([region1Key, region2Key, ...getRegionKeys()])
        })
      })

      describe('when setting default region', () => {
        const mySecondWorkspace: BasicTestWorkspace = {
          id: '',
          ownerId: '',
          slug: '',
          name: 'My second workspace'
        }

        before(async () => {
          await createTestWorkspace(mySecondWorkspace, me)
        })

        beforeEach(async () => {
          await db
            .from(WorkspaceRegions.name)
            .where({
              [WorkspaceRegions.col.workspaceId]: mySecondWorkspace.id
            })
            .delete()
        })

        it("can't set default region if not workspace admin", async () => {
          const res = await apollo.execute(
            SetWorkspaceDefaultRegionDocument,
            { workspaceId: mySecondWorkspace.id, regionKey: region1Key },
            { authUserId: otherGuy.id }
          )

          expect(res).to.haveGraphQLErrors('You are not authorized')
          expect(res.data?.workspaceMutations.setDefaultRegion).to.be.not.ok
        })

        it('can set default region if workspace admin', async () => {
          const res = await apollo.execute(SetWorkspaceDefaultRegionDocument, {
            workspaceId: mySecondWorkspace.id,
            regionKey: region1Key
          })

          expect(res).to.not.haveGraphQLErrors()
          expect(
            res.data?.workspaceMutations.setDefaultRegion.defaultRegion?.key
          ).to.equal(region1Key)
        })
      })

      describe('with existing default region', () => {
        const myThirdWorkspace: BasicTestWorkspace = {
          id: '',
          ownerId: '',
          slug: '',
          name: 'My third workspace'
        }

        before(async () => {
          await createTestWorkspace(myThirdWorkspace, me)
          await apollo.execute(
            SetWorkspaceDefaultRegionDocument,
            {
              workspaceId: myThirdWorkspace.id,
              regionKey: region1Key
            },
            { assertNoErrors: true }
          )
        })

        it("can't override default region", async () => {
          const res = await apollo.execute(SetWorkspaceDefaultRegionDocument, {
            workspaceId: myThirdWorkspace.id,
            regionKey: region2Key
          })

          expect(res).to.haveGraphQLErrors('Workspace already has a region assigned')
          expect(res.data?.workspaceMutations.setDefaultRegion.defaultRegion).to.be.not
            .ok
        })

        it('can list default region if workspace admin', async () => {
          const res = await apollo.execute(GetWorkspaceDefaultRegionDocument, {
            workspaceId: myThirdWorkspace.id
          })

          expect(res).to.not.haveGraphQLErrors()
          expect(res.data?.workspace.defaultRegion?.key).to.equal(region1Key)
        })

        it("can't list default region if not workspace admin", async () => {
          const res = await apollo.execute(
            GetWorkspaceDefaultRegionDocument,
            { workspaceId: myThirdWorkspace.id },
            { authUserId: otherGuy.id }
          )

          expect(res).to.haveGraphQLErrors('You are not authorized')
          expect(res.data?.workspace.defaultRegion).to.be.not.ok
        })
      })
    })
  : void 0
