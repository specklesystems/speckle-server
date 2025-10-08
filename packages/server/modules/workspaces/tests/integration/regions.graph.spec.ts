import { db } from '@/db/knex'
import { isMultiRegionEnabled } from '@/modules/multiregion/helpers'
import { setMultiRegionConfig } from '@/modules/multiregion/regionConfig'
import { storeRegionFactory } from '@/modules/multiregion/repositories'
import { WorkspaceRegions } from '@/modules/workspaces/repositories/regions'
import type { BasicTestWorkspace } from '@/modules/workspaces/tests/helpers/creation'
import {
  assignToWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import type { BasicTestUser } from '@/test/authHelper'
import { createTestUser } from '@/test/authHelper'
import {
  GetAvailableRegionsDocument,
  GetWorkspaceDefaultRegionDocument,
  SetWorkspaceDefaultRegionDocument
} from '@/modules/core/graph/generated/graphql'
import type { TestApolloServer } from '@/test/graphqlHelper'
import { testApolloServer } from '@/test/graphqlHelper'
import { beforeEachContext, getRegionKeys } from '@/test/hooks'
import { truncateRegionsSafely } from '@/test/speckle-helpers/regions'
import { PaidWorkspacePlans, Roles } from '@speckle/shared'
import { getConnectionSettings } from '@speckle/shared/environment/db'
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
        // Faking multi region config
        const connectionUri = getConnectionSettings(db).connectionString!
        const region = {
          postgres: {
            connectionUri,
            skipInitialization: true
          }
        }

        setMultiRegionConfig({
          regions: {
            [region1Key]: region,
            [region2Key]: region
          }
        })
        await beforeEachContext()

        me = await createTestUser({ role: Roles.Server.Admin })
        otherGuy = await createTestUser({ role: Roles.Server.User })

        await Promise.all([
          // Create first test workspace
          createTestWorkspace(myFirstWorkspace, me, {
            // pro for custom regions
            addPlan: { name: PaidWorkspacePlans.Pro }
          }),
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
        setMultiRegionConfig(undefined)
        await truncateRegionsSafely()
      })

      describe('when listing', () => {
        it('can list if workspace admin', async () => {
          const res = await apollo.execute(GetAvailableRegionsDocument, {})

          expect(res).to.not.haveGraphQLErrors()
          expect(
            res.data?.serverInfo.multiRegion.regions.map((r) => r.key)
          ).to.deep.equalInAnyOrder([region1Key, region2Key, ...getRegionKeys()])
        })
      })

      it("can't set default region on invalid plan", async () => {
        const workspace: BasicTestWorkspace = {
          id: '',
          ownerId: '',
          slug: '',
          name: 'My second workspace'
        }
        await createTestWorkspace(workspace, me, {
          addPlan: { name: PaidWorkspacePlans.Team }
        })

        const res = await apollo.execute(
          SetWorkspaceDefaultRegionDocument,
          { workspaceId: workspace.id, regionKey: region1Key },
          { authUserId: me.id }
        )

        expect(res).to.haveGraphQLErrors('Specified region not available for workspace')
        expect(res.data?.workspaceMutations.setDefaultRegion).to.be.not.ok
      })

      describe('when setting default region on valid plan', () => {
        const mySecondWorkspace: BasicTestWorkspace = {
          id: '',
          ownerId: '',
          slug: '',
          name: 'My second workspace'
        }

        before(async () => {
          await createTestWorkspace(mySecondWorkspace, me, {
            // pro for custom regions
            addPlan: { name: PaidWorkspacePlans.Pro }
          })
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
          await createTestWorkspace(myThirdWorkspace, me, {
            // pro for custom regions
            addPlan: { name: PaidWorkspacePlans.Pro }
          })
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
