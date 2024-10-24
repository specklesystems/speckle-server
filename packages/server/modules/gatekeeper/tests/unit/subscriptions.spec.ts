import {
  SubscriptionData,
  WorkspacePlan,
  WorkspaceSubscription
} from '@/modules/gatekeeper/domain/billing'
import {
  WorkspacePlanMismatchError,
  WorkspacePlanNotFoundError,
  WorkspaceSubscriptionNotFoundError
} from '@/modules/gatekeeper/errors/billing'
import { handleSubscriptionUpdateFactory } from '@/modules/gatekeeper/services/subscriptions'
import { expectToThrow } from '@/test/assertionHelper'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import { merge } from 'lodash'

const createTestSubscriptionData = (
  overrides: Partial<SubscriptionData> = {}
): SubscriptionData => {
  const defaultValues: SubscriptionData = {
    cancelAt: null,
    customerId: cryptoRandomString({ length: 10 }),
    products: [
      {
        priceId: cryptoRandomString({ length: 10 }),
        productId: cryptoRandomString({ length: 10 }),
        quantity: 3,
        subscriptionItemId: cryptoRandomString({ length: 10 })
      }
    ],
    status: 'active',
    subscriptionId: cryptoRandomString({ length: 10 })
  }
  return merge(defaultValues, overrides)
}

describe('subscriptions @gatekeeper', () => {
  describe('handleSubscriptionUpdateFactory creates a function, that', () => {
    it('throws if subscription is not found', async () => {
      const subscriptionData = createTestSubscriptionData()
      const err = await expectToThrow(async () => {
        await handleSubscriptionUpdateFactory({
          getWorkspaceSubscriptionBySubscriptionId: async () => null,
          getWorkspacePlan: async () => {
            expect.fail()
          },
          upsertWorkspaceSubscription: async () => {
            expect.fail()
          },
          upsertPaidWorkspacePlan: async () => {
            expect.fail()
          }
        })({ subscriptionData })
      })
      expect(err.message).to.equal(new WorkspaceSubscriptionNotFoundError().message)
    })
    it('throws if workspacePlan is not found', async () => {
      const subscriptionData = createTestSubscriptionData()
      const err = await expectToThrow(async () => {
        await handleSubscriptionUpdateFactory({
          getWorkspaceSubscriptionBySubscriptionId: async () => ({
            subscriptionData,
            billingInterval: 'monthly',
            createdAt: new Date(),
            updatedAt: new Date(),
            currentBillingCycleEnd: new Date(),
            workspaceId: cryptoRandomString({ length: 10 })
          }),
          getWorkspacePlan: async () => null,
          upsertWorkspaceSubscription: async () => {
            expect.fail()
          },
          upsertPaidWorkspacePlan: async () => {
            expect.fail()
          }
        })({ subscriptionData })
      })
      expect(err.message).to.equal(new WorkspacePlanNotFoundError().message)
    })
    ;(['unlimited', 'academia'] as const).forEach((name) =>
      it(`throws for non paid workspace plan: ${name}`, async () => {
        const subscriptionData = createTestSubscriptionData()
        const workspaceId = cryptoRandomString({ length: 10 })
        const err = await expectToThrow(async () => {
          await handleSubscriptionUpdateFactory({
            getWorkspaceSubscriptionBySubscriptionId: async () => ({
              subscriptionData,
              billingInterval: 'monthly',
              createdAt: new Date(),
              updatedAt: new Date(),
              currentBillingCycleEnd: new Date(),
              workspaceId
            }),
            getWorkspacePlan: async () => ({ name, workspaceId, status: 'valid' }),
            upsertWorkspaceSubscription: async () => {
              expect.fail()
            },
            upsertPaidWorkspacePlan: async () => {
              expect.fail()
            }
          })({ subscriptionData })
        })
        expect(err.message).to.equal(new WorkspacePlanMismatchError().message)
      })
    )
    it('sets the state to cancelationScheduled', async () => {
      const subscriptionData = createTestSubscriptionData({
        status: 'active',
        cancelAt: new Date(2099, 12, 31)
      })
      const workspaceId = cryptoRandomString({ length: 10 })
      const workspaceSubscription = {
        subscriptionData,
        billingInterval: 'monthly' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        currentBillingCycleEnd: new Date(),
        workspaceId
      }

      let updatedSubscription: WorkspaceSubscription | undefined = undefined
      let updatedPlan: WorkspacePlan | undefined = undefined

      await handleSubscriptionUpdateFactory({
        getWorkspaceSubscriptionBySubscriptionId: async () => workspaceSubscription,
        getWorkspacePlan: async () => ({ name: 'team', workspaceId, status: 'trial' }),
        upsertWorkspaceSubscription: async ({ workspaceSubscription }) => {
          updatedSubscription = workspaceSubscription
        },
        upsertPaidWorkspacePlan: async ({ workspacePlan }) => {
          updatedPlan = workspacePlan
        }
      })({ subscriptionData })
      expect(updatedPlan!.status).to.be.equal('cancelationScheduled')
      expect(updatedSubscription).deep.equal(workspaceSubscription)
    })
    it('sets the state to valid', async () => {
      const subscriptionData = createTestSubscriptionData({
        status: 'active',
        cancelAt: null
      })
      const workspaceId = cryptoRandomString({ length: 10 })
      const workspaceSubscription = {
        subscriptionData,
        billingInterval: 'monthly' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        currentBillingCycleEnd: new Date(),
        workspaceId
      }

      let updatedSubscription: WorkspaceSubscription | undefined = undefined
      let updatedPlan: WorkspacePlan | undefined = undefined

      await handleSubscriptionUpdateFactory({
        getWorkspaceSubscriptionBySubscriptionId: async () => workspaceSubscription,
        getWorkspacePlan: async () => ({ name: 'team', workspaceId, status: 'trial' }),
        upsertWorkspaceSubscription: async ({ workspaceSubscription }) => {
          updatedSubscription = workspaceSubscription
        },
        upsertPaidWorkspacePlan: async ({ workspacePlan }) => {
          updatedPlan = workspacePlan
        }
      })({ subscriptionData })
      expect(updatedPlan!.status).to.be.equal('valid')
      expect(updatedSubscription).deep.equal(workspaceSubscription)
    })
    it('sets the state to paymentFailed', async () => {
      const subscriptionData = createTestSubscriptionData({
        status: 'past_due'
      })
      const workspaceId = cryptoRandomString({ length: 10 })
      const workspaceSubscription = {
        subscriptionData,
        billingInterval: 'monthly' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        currentBillingCycleEnd: new Date(),
        workspaceId
      }

      let updatedSubscription: WorkspaceSubscription | undefined = undefined
      let updatedPlan: WorkspacePlan | undefined = undefined

      await handleSubscriptionUpdateFactory({
        getWorkspaceSubscriptionBySubscriptionId: async () => workspaceSubscription,
        getWorkspacePlan: async () => ({ name: 'team', workspaceId, status: 'trial' }),
        upsertWorkspaceSubscription: async ({ workspaceSubscription }) => {
          updatedSubscription = workspaceSubscription
        },
        upsertPaidWorkspacePlan: async ({ workspacePlan }) => {
          updatedPlan = workspacePlan
        }
      })({ subscriptionData })
      expect(updatedPlan!.status).to.be.equal('paymentFailed')
      expect(updatedSubscription).deep.equal(workspaceSubscription)
    })
    it('sets the state to canceled', async () => {
      const subscriptionData = createTestSubscriptionData({
        status: 'canceled'
      })
      const workspaceId = cryptoRandomString({ length: 10 })
      const workspaceSubscription = {
        subscriptionData,
        billingInterval: 'monthly' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        currentBillingCycleEnd: new Date(),
        workspaceId
      }

      let updatedSubscription: WorkspaceSubscription | undefined = undefined
      let updatedPlan: WorkspacePlan | undefined = undefined

      await handleSubscriptionUpdateFactory({
        getWorkspaceSubscriptionBySubscriptionId: async () => workspaceSubscription,
        getWorkspacePlan: async () => ({ name: 'team', workspaceId, status: 'trial' }),
        upsertWorkspaceSubscription: async ({ workspaceSubscription }) => {
          updatedSubscription = workspaceSubscription
        },
        upsertPaidWorkspacePlan: async ({ workspacePlan }) => {
          updatedPlan = workspacePlan
        }
      })({ subscriptionData })
      expect(updatedPlan!.status).to.be.equal('canceled')
      expect(updatedSubscription).deep.equal(workspaceSubscription)
    })
    ;(
      ['incomplete', 'incomplete_expired', 'trialing', 'unpaid', 'paused'] as const
    ).forEach((status) => {
      it(`does not update the plan or the subscription in case of an unhandled status: ${status}`, async () => {
        const subscriptionData = createTestSubscriptionData({
          status
        })
        const workspaceId = cryptoRandomString({ length: 10 })
        const workspaceSubscription = {
          subscriptionData,
          billingInterval: 'monthly' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          currentBillingCycleEnd: new Date(),
          workspaceId
        }

        await handleSubscriptionUpdateFactory({
          getWorkspaceSubscriptionBySubscriptionId: async () => workspaceSubscription,
          getWorkspacePlan: async () => ({
            name: 'team',
            workspaceId,
            status: 'trial'
          }),
          upsertWorkspaceSubscription: async () => {
            expect.fail()
          },
          upsertPaidWorkspacePlan: async () => {
            expect.fail()
          }
        })({ subscriptionData })
      })
    })
  })
})
