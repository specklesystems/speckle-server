import { db } from '@/db/knex'
import { AllScopes } from '@/modules/core/helpers/mainConstants'
import {
  createRandomEmail,
  createRandomString
} from '@/modules/core/helpers/testHelpers'
import { WorkspaceSeatType } from '@/modules/gatekeeper/domain/billing'
import { upsertWorkspaceSubscriptionFactory } from '@/modules/gatekeeper/repositories/billing'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import {
  assignToWorkspace,
  createTestWorkspace
} from '@/modules/workspaces/tests/helpers/creation'
import {
  BasicTestUser,
  createAuthTokenForUser,
  createTestUser,
  createTestUsers,
  login
} from '@/test/authHelper'
import {
  GetWorkspaceDocument,
  GetWorkspaceWithSeatsByTypeDocument,
  GetWorkspaceWithSubscriptionDocument
} from '@/test/graphql/generated/graphql'
import {
  createTestContext,
  testApolloServer,
  TestApolloServer
} from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import dayjs from 'dayjs'

const { FF_BILLING_INTEGRATION_ENABLED } = getFeatureFlags()

describe('Workspaces Billing', () => {
  let apollo: TestApolloServer

  const testAdminUser: BasicTestUser = {
    id: '',
    name: 'John Speckle',
    email: 'john-speckle@example.org',
    role: Roles.Server.Admin,
    verified: true
  }

  before(async () => {
    await beforeEachContext()
    await createTestUsers([testAdminUser])
    const token = await createAuthTokenForUser(testAdminUser.id, AllScopes)
    apollo = await testApolloServer({
      context: await createTestContext({
        auth: true,
        userId: testAdminUser.id,
        token,
        role: testAdminUser.role,
        scopes: AllScopes
      })
    })
  })
  ;(FF_BILLING_INTEGRATION_ENABLED ? describe : describe.skip)(
    'query workspace.readOnly',
    () => {
      it('should return false for workspace plan status valid', async () => {
        const workspace = {
          id: '',
          name: 'test ws',
          slug: cryptoRandomString({ length: 10 }),
          ownerId: ''
        }
        await createTestWorkspace(workspace, testAdminUser, {
          addPlan: { name: 'business', status: 'valid' }
        })

        const res = await apollo.execute(GetWorkspaceDocument, {
          workspaceId: workspace.id
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace?.readOnly).to.be.false
      })
      it('should return true for workspace plan status expired', async () => {
        const workspace = {
          id: '',
          name: 'test ws',
          slug: cryptoRandomString({ length: 10 }),
          ownerId: ''
        }
        await createTestWorkspace(workspace, testAdminUser, {
          addPlan: { name: 'business', status: 'expired' }
        })

        const res = await apollo.execute(GetWorkspaceDocument, {
          workspaceId: workspace.id
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace?.readOnly).to.be.true
      })
      it('should return false for workspace plan status trial', async () => {
        const workspace = {
          id: '',
          name: 'test ws',
          slug: cryptoRandomString({ length: 10 }),
          ownerId: ''
        }
        await createTestWorkspace(workspace, testAdminUser, {
          addPlan: { name: 'business', status: 'trial' }
        })

        const res = await apollo.execute(GetWorkspaceDocument, {
          workspaceId: workspace.id
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res.data?.workspace?.readOnly).to.be.false
      })
    }
  )
  ;(FF_BILLING_INTEGRATION_ENABLED ? describe : describe.skip)(
    'workspace.subscription',
    () => {
      describe('subscription.seats', () => {
        it('should return the number of assigned seats', async () => {
          const user = await createTestUser({
            name: createRandomString(),
            email: createRandomEmail(),
            role: Roles.Server.Admin,
            verified: true
          })
          const workspace = {
            id: createRandomString(),
            name: createRandomString(),
            slug: cryptoRandomString({ length: 10 }),
            ownerId: user.id
          }
          await createTestWorkspace(workspace, user, {
            addPlan: { name: 'pro', status: 'valid' }
          })
          await upsertWorkspaceSubscriptionFactory({ db })({
            workspaceSubscription: {
              workspaceId: workspace.id,
              createdAt: new Date(),
              updatedAt: new Date(),
              currentBillingCycleEnd: dayjs().add(1, 'month').toDate(),
              billingInterval: 'monthly',
              subscriptionData: {
                subscriptionId: cryptoRandomString({ length: 10 }),
                customerId: cryptoRandomString({ length: 10 }),
                cancelAt: null,
                status: 'active',
                currentPeriodEnd: new Date(),
                products: [
                  {
                    priceId: createRandomString(),
                    quantity: 12,
                    productId: createRandomString(),
                    subscriptionItemId: createRandomString()
                  }
                ]
              }
            }
          })
          const session = await login(user)

          const res = await session.execute(GetWorkspaceWithSubscriptionDocument, {
            workspaceId: workspace.id
          })

          expect(res).to.not.haveGraphQLErrors()
          const seats = res.data?.workspace.subscription?.seats
          expect(seats?.assigned).to.eq(1)
        })
        it('should return the number of viewers', async () => {
          const user = await createTestUser({
            name: createRandomString(),
            email: createRandomEmail(),
            role: Roles.Server.Admin,
            verified: true
          })
          const workspace = {
            id: createRandomString(),
            name: createRandomString(),
            slug: cryptoRandomString({ length: 10 }),
            ownerId: user.id
          }
          await createTestWorkspace(workspace, user, {
            addPlan: { name: 'pro', status: 'valid' }
          })
          await upsertWorkspaceSubscriptionFactory({ db })({
            workspaceSubscription: {
              workspaceId: workspace.id,
              createdAt: new Date(),
              updatedAt: new Date(),
              currentBillingCycleEnd: dayjs().add(1, 'month').toDate(),
              billingInterval: 'monthly',
              subscriptionData: {
                subscriptionId: cryptoRandomString({ length: 10 }),
                customerId: cryptoRandomString({ length: 10 }),
                cancelAt: null,
                status: 'active',
                currentPeriodEnd: new Date(),
                products: [
                  {
                    priceId: createRandomString(),
                    quantity: 12,
                    productId: createRandomString(),
                    subscriptionItemId: createRandomString()
                  }
                ]
              }
            }
          })
          const viewer1 = await createTestUser({
            name: createRandomString(),
            email: createRandomEmail(),
            role: Roles.Server.User,
            verified: true
          })
          await assignToWorkspace(
            workspace,
            viewer1,
            Roles.Workspace.Member,
            WorkspaceSeatType.Viewer
          )
          const viewer2 = await createTestUser({
            name: createRandomString(),
            email: createRandomEmail(),
            role: Roles.Server.User,
            verified: true
          })
          await assignToWorkspace(
            workspace,
            viewer2,
            Roles.Workspace.Member,
            WorkspaceSeatType.Viewer
          )

          const session = await login(user)

          const res = await session.execute(GetWorkspaceWithSubscriptionDocument, {
            workspaceId: workspace.id
          })

          expect(res).to.not.haveGraphQLErrors()
          const seats = res.data?.workspace.subscription?.seats
          expect(seats?.viewersCount).to.eq(2)
        })
      })
    }
  )
  describe('workspace.seatsByType', () => {
    it('should return the number of editors and viewers in a workspace', async () => {
      const user = await createTestUser({
        name: createRandomString(),
        email: createRandomEmail(),
        role: Roles.Server.Admin,
        verified: true
      })
      const workspace = {
        id: createRandomString(),
        name: createRandomString(),
        slug: cryptoRandomString({ length: 10 }),
        ownerId: user.id
      }
      await createTestWorkspace(workspace, user, {
        addPlan: { name: 'pro', status: 'valid' }
      })
      const viewer1 = await createTestUser({
        name: createRandomString(),
        email: createRandomEmail(),
        role: Roles.Server.User,
        verified: true
      })
      await assignToWorkspace(
        workspace,
        viewer1,
        Roles.Workspace.Member,
        WorkspaceSeatType.Viewer
      )
      const viewer2 = await createTestUser({
        name: createRandomString(),
        email: createRandomEmail(),
        role: Roles.Server.User,
        verified: true
      })
      await assignToWorkspace(
        workspace,
        viewer2,
        Roles.Workspace.Member,
        WorkspaceSeatType.Viewer
      )

      const editor1 = await createTestUser({
        name: createRandomString(),
        email: createRandomEmail(),
        role: Roles.Server.User,
        verified: true
      })
      await assignToWorkspace(
        workspace,
        editor1,
        Roles.Workspace.Member,
        WorkspaceSeatType.Editor
      )
      const editor2 = await createTestUser({
        name: createRandomString(),
        email: createRandomEmail(),
        role: Roles.Server.User,
        verified: true
      })
      await assignToWorkspace(
        workspace,
        editor2,
        Roles.Workspace.Member,
        WorkspaceSeatType.Editor
      )

      const session = await login(user)

      const res = await session.execute(GetWorkspaceWithSeatsByTypeDocument, {
        workspaceId: workspace.id
      })

      expect(res).to.not.haveGraphQLErrors()
      const seats = res.data?.workspace.seatsByType
      expect(seats?.viewers?.totalCount).to.eq(2)
      expect(seats?.editors?.totalCount).to.eq(3)
    })
  })
})
