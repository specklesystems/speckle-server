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
  GetWorkspacePlanUsageDocument,
  GetWorkspaceWithSubscriptionDocument
} from '@/test/graphql/generated/graphql'
import {
  createTestContext,
  testApolloServer,
  TestApolloServer
} from '@/test/graphqlHelper'
import { beforeEachContext } from '@/test/hooks'
import { createTestBranches } from '@/test/speckle-helpers/branchHelper'
import { BasicTestStream, createTestStream } from '@/test/speckle-helpers/streamHelper'
import { Roles } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import dayjs from 'dayjs'

const { FF_BILLING_INTEGRATION_ENABLED, FF_WORKSPACES_MODULE_ENABLED } =
  getFeatureFlags()

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
          expect(seats?.editors.assigned).to.eq(1)
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
          expect(seats?.viewers.assigned).to.eq(2)
        })
      })
    }
  )
  ;(FF_WORKSPACES_MODULE_ENABLED ? describe : describe.skip)(
    'workspace.subscription.usage',
    () => {
      it('should return accurate usage information', async () => {
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

        const project: BasicTestStream = {
          id: createRandomString(),
          name: createRandomString(),
          ownerId: user.id,
          isPublic: true,
          workspaceId: workspace.id
        }
        await createTestStream(project, user)
        await createTestBranches([
          {
            owner: user,
            stream: project,
            branch: {
              id: createRandomString(),
              streamId: project.id,
              authorId: user.id,
              name: createRandomString()
            }
          },
          {
            owner: user,
            stream: project,
            branch: {
              id: createRandomString(),
              streamId: project.id,
              authorId: user.id,
              name: createRandomString()
            }
          },
          {
            owner: user,
            stream: project,
            branch: {
              id: createRandomString(),
              streamId: project.id,
              authorId: user.id,
              name: createRandomString()
            }
          }
        ])

        const session = await login(user)

        const res = await session.execute(GetWorkspacePlanUsageDocument, {
          workspaceId: workspace.id
        })

        expect(res).to.not.haveGraphQLErrors()
        expect(res?.data?.workspace?.plan?.usage?.projectCount).to.equal(1)
        expect(res?.data?.workspace?.plan?.usage?.modelCount).to.equal(3)
      })
    }
  )
})
