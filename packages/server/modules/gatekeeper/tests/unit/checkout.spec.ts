import {
  CheckoutSessionNotFoundError,
  WorkspaceAlreadyPaidError,
  WorkspaceCheckoutSessionInProgressError
} from '@/modules/gatekeeper/errors/billing'
import {
  completeCheckoutSessionFactory,
  startCheckoutSessionFactory
} from '@/modules/gatekeeper/services/checkout'
import { expectToThrow } from '@/test/assertionHelper'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import {
  CheckoutSession,
  PaidWorkspacePlan,
  SubscriptionData,
  WorkspaceSubscription
} from '@/modules/gatekeeper/domain/billing'
import {
  PaidWorkspacePlans,
  WorkspacePlanBillingIntervals
} from '@/modules/gatekeeper/domain/workspacePricing'

describe('checkout @gatekeeper', () => {
  describe('startCheckoutSessionFactory creates a function, that', () => {
    it('does not allow checkout for workspace plans, that is in a valid state', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const err = await expectToThrow(() =>
        startCheckoutSessionFactory({
          getWorkspacePlan: async () => ({
            name: 'pro',
            status: 'valid',
            workspaceId
          }),
          getWorkspaceCheckoutSession: () => {
            expect.fail()
          },
          countRole: () => {
            expect.fail()
          },
          createCheckoutSession: () => {
            expect.fail()
          },
          saveCheckoutSession: () => {
            expect.fail()
          }
        })({
          workspaceId,
          billingInterval: 'monthly',
          workspacePlan: 'business',
          workspaceSlug: cryptoRandomString({ length: 10 })
        })
      )
      expect(err.message).to.be.equal(new WorkspaceAlreadyPaidError().message)
    })
    it('does not allow checkout for workspace plans, that is in a paymentFailed state', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const err = await expectToThrow(() =>
        startCheckoutSessionFactory({
          getWorkspacePlan: async () => ({
            name: 'pro',
            status: 'paymentFailed',
            workspaceId
          }),
          getWorkspaceCheckoutSession: () => {
            expect.fail()
          },
          countRole: () => {
            expect.fail()
          },
          createCheckoutSession: () => {
            expect.fail()
          },
          saveCheckoutSession: () => {
            expect.fail()
          }
        })({
          workspaceId,
          billingInterval: 'monthly',
          workspacePlan: 'business',
          workspaceSlug: cryptoRandomString({ length: 10 })
        })
      )
      expect(err.message).to.be.equal(new WorkspaceAlreadyPaidError().message)
    })
    it('does not allow checkout for a workspace, that already has a checkout session', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const err = await expectToThrow(() =>
        startCheckoutSessionFactory({
          getWorkspacePlan: async () => ({
            name: 'team',
            status: 'trial',
            workspaceId
          }),
          getWorkspaceCheckoutSession: async () => ({
            billingInterval: 'monthly',
            id: cryptoRandomString({ length: 10 }),
            paymentStatus: 'unpaid',
            url: '',
            workspaceId,
            workspacePlan: 'business',
            createdAt: new Date(),
            updatedAt: new Date()
          }),
          countRole: () => {
            expect.fail()
          },
          createCheckoutSession: () => {
            expect.fail()
          },
          saveCheckoutSession: () => {
            expect.fail()
          }
        })({
          workspaceId,
          billingInterval: 'monthly',
          workspacePlan: 'business',
          workspaceSlug: cryptoRandomString({ length: 10 })
        })
      )
      expect(err.message).to.be.equal(
        new WorkspaceCheckoutSessionInProgressError().message
      )
    })
    it('creates and stores a checkout for workspaces that are not on a plan', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const workspacePlan: PaidWorkspacePlans = 'pro'
      const billingInterval: WorkspacePlanBillingIntervals = 'monthly'
      const checkoutSession: CheckoutSession = {
        id: cryptoRandomString({ length: 10 }),
        workspaceId,
        workspacePlan,
        url: 'https://example.com',
        billingInterval,
        paymentStatus: 'unpaid',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      let storedCheckoutSession: CheckoutSession | undefined = undefined
      const createdCheckoutSession = await startCheckoutSessionFactory({
        getWorkspacePlan: async () => null,
        getWorkspaceCheckoutSession: async () => null,
        countRole: async () => 1,
        createCheckoutSession: async () => checkoutSession,
        saveCheckoutSession: async ({ checkoutSession }) => {
          storedCheckoutSession = checkoutSession
        }
      })({
        workspaceId,
        billingInterval,
        workspacePlan,
        workspaceSlug: cryptoRandomString({ length: 10 })
      })
      expect(checkoutSession).deep.equal(storedCheckoutSession)
      expect(checkoutSession).deep.equal(createdCheckoutSession)
    })
    it('creates and stores a checkout for TRIAL and CANCELLED workspaces', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const workspacePlan: PaidWorkspacePlans = 'pro'
      const billingInterval: WorkspacePlanBillingIntervals = 'monthly'
      const checkoutSession: CheckoutSession = {
        id: cryptoRandomString({ length: 10 }),
        workspaceId,
        workspacePlan,
        url: 'https://example.com',
        billingInterval,
        paymentStatus: 'unpaid',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      let storedCheckoutSession: CheckoutSession | undefined = undefined
      const createdCheckoutSession = await startCheckoutSessionFactory({
        getWorkspacePlan: async () => null,
        getWorkspaceCheckoutSession: async () => null,
        countRole: async () => 1,
        createCheckoutSession: async () => checkoutSession,
        saveCheckoutSession: async ({ checkoutSession }) => {
          storedCheckoutSession = checkoutSession
        }
      })({
        workspaceId,
        billingInterval,
        workspacePlan,
        workspaceSlug: cryptoRandomString({ length: 10 })
      })
      expect(checkoutSession).deep.equal(storedCheckoutSession)
      expect(checkoutSession).deep.equal(createdCheckoutSession)
    })
  })
  describe('completeCheckoutSessionFactory creates a function, that', () => {
    it('throws a CheckoutSessionNotFound if the checkoutSession is null', async () => {
      const sessionId = cryptoRandomString({ length: 10 })
      const subscriptionId = cryptoRandomString({ length: 10 })

      const err = await expectToThrow(async () => {
        await completeCheckoutSessionFactory({
          getCheckoutSession: async () => null,
          updateCheckoutSessionStatus: async () => {
            expect.fail()
          },
          upsertPaidWorkspacePlan: async () => {
            expect.fail()
          },
          getSubscriptionData: async () => {
            expect.fail()
          },
          saveWorkspaceSubscription: async () => {
            expect.fail()
          }
        })({ sessionId, subscriptionId })
        expect(err.message).to.equal(new CheckoutSessionNotFoundError().message)
      })
    })
    it('throws for already paid checkout sessions', async () => {
      const sessionId = cryptoRandomString({ length: 10 })
      const subscriptionId = cryptoRandomString({ length: 10 })

      const err = await expectToThrow(async () => {
        await completeCheckoutSessionFactory({
          getCheckoutSession: async () => ({
            billingInterval: 'monthly',
            id: sessionId,
            paymentStatus: 'paid',
            url: 'https://example.com',
            workspaceId: cryptoRandomString({ length: 10 }),
            workspacePlan: 'business',
            createdAt: new Date(),
            updatedAt: new Date()
          }),
          updateCheckoutSessionStatus: async () => {
            expect.fail()
          },
          upsertPaidWorkspacePlan: async () => {
            expect.fail()
          },
          getSubscriptionData: async () => {
            expect.fail()
          },
          saveWorkspaceSubscription: async () => {
            expect.fail()
          }
        })({ sessionId, subscriptionId })
        expect(err.message).to.equal(new WorkspaceAlreadyPaidError().message)
      })
    }),
      (['monthly', 'yearly'] as const).forEach((billingInterval) => {
        it(`sets the billingCycleEnd end for ${billingInterval} based on the checkoutSession.billingInterval`, async () => {
          const sessionId = cryptoRandomString({ length: 10 })
          const subscriptionId = cryptoRandomString({ length: 10 })
          const workspaceId = cryptoRandomString({ length: 10 })

          const storedCheckoutSession: CheckoutSession = {
            billingInterval,
            id: sessionId,
            paymentStatus: 'unpaid',
            url: 'https://example.com',
            workspaceId,
            workspacePlan: 'business',
            createdAt: new Date(),
            updatedAt: new Date()
          }

          let storedWorkspacePlan: PaidWorkspacePlan | undefined = undefined

          const subscriptionData: SubscriptionData = {
            customerId: cryptoRandomString({ length: 10 }),
            subscriptionId: cryptoRandomString({ length: 10 }),
            products: [
              {
                priceId: cryptoRandomString({ length: 10 }),
                productId: cryptoRandomString({ length: 10 }),
                quantity: 10,
                subscriptionItemId: cryptoRandomString({ length: 10 })
              }
            ]
          }

          let storedWorkspaceSubscriptionData: WorkspaceSubscription | undefined =
            undefined

          await completeCheckoutSessionFactory({
            getCheckoutSession: async () => storedCheckoutSession,
            updateCheckoutSessionStatus: async ({ paymentStatus }) => {
              storedCheckoutSession.paymentStatus = paymentStatus
            },
            upsertPaidWorkspacePlan: async ({ workspacePlan }) => {
              storedWorkspacePlan = workspacePlan
            },
            getSubscriptionData: async () => subscriptionData,
            saveWorkspaceSubscription: async ({ workspaceSubscription }) => {
              storedWorkspaceSubscriptionData = workspaceSubscription
            }
          })({ sessionId, subscriptionId })

          expect(storedCheckoutSession.paymentStatus).to.equal('paid')
          expect(storedWorkspacePlan).to.deep.equal({
            workspaceId,
            name: storedCheckoutSession.workspacePlan,
            status: 'valid'
          })
          expect(storedWorkspaceSubscriptionData!.billingInterval).to.equal(
            storedCheckoutSession.billingInterval
          )

          expect(storedWorkspaceSubscriptionData!.subscriptionData).to.equal(
            subscriptionData
          )
          let billingCycleEndsIn: number
          const expectedCycleLength = 1
          switch (billingInterval) {
            case 'monthly':
              billingCycleEndsIn =
                storedWorkspaceSubscriptionData!.currentBillingCycleEnd.getMonth() -
                new Date().getMonth()
              break
            case 'yearly':
              billingCycleEndsIn =
                storedWorkspaceSubscriptionData!.currentBillingCycleEnd.getFullYear() -
                new Date().getFullYear()
              break
          }
          expect(billingCycleEndsIn).to.be.equal(expectedCycleLength)
        })
      })
  })
})
