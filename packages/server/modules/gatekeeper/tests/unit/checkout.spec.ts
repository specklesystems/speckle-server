import {
  CheckoutSessionNotFoundError,
  WorkspaceAlreadyPaidError,
  WorkspaceCheckoutSessionInProgressError
} from '@/modules/gatekeeper/errors/billing'
import { completeCheckoutSessionFactory } from '@/modules/gatekeeper/services/checkout'
import { expectToThrow } from '@/test/assertionHelper'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import type {
  CheckoutSession,
  SubscriptionData,
  WorkspaceSubscription
} from '@/modules/gatekeeper/domain/billing'
import { omit } from 'lodash-es'
import type { PaidWorkspacePlan, WorkspacePlanBillingIntervals } from '@speckle/shared'
import { PaidWorkspacePlans } from '@speckle/shared'
import { startCheckoutSessionFactory } from '@/modules/gatekeeper/services/checkout/startCheckoutSession'
import { NotFoundError } from '@/modules/shared/errors'
import { buildTestWorkspacePlan } from '@/modules/gatekeeper/tests/helpers/workspacePlan'

describe('checkout @gatekeeper', () => {
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
          getWorkspacePlan: async () => null,
          getWorkspaceSubscription: async () => null,
          getSubscriptionData: async () => {
            expect.fail()
          },
          emitEvent: async () => {
            expect.fail()
          },
          upsertWorkspaceSubscription: async () => {
            expect.fail()
          }
        })({ sessionId, subscriptionId })
        expect(err.message).to.equal(new CheckoutSessionNotFoundError().message)
      })
    })
    it('throws for already paid checkout sessions', async () => {
      const sessionId = cryptoRandomString({ length: 10 })
      const subscriptionId = cryptoRandomString({ length: 10 })
      const userId = cryptoRandomString({ length: 10 })

      const err = await expectToThrow(async () => {
        await completeCheckoutSessionFactory({
          getCheckoutSession: async () => ({
            billingInterval: 'monthly',
            id: sessionId,
            userId,
            paymentStatus: 'paid',
            url: 'https://example.com',
            workspaceId: cryptoRandomString({ length: 10 }),
            workspacePlan: PaidWorkspacePlans.Team,
            currency: 'usd',
            createdAt: new Date(),
            updatedAt: new Date()
          }),
          updateCheckoutSessionStatus: async () => {
            expect.fail()
          },
          upsertPaidWorkspacePlan: async () => {
            expect.fail()
          },
          getWorkspacePlan: async () => null,
          getWorkspaceSubscription: async () => null,
          getSubscriptionData: async () => {
            expect.fail()
          },
          emitEvent: async () => {
            expect.fail()
          },
          upsertWorkspaceSubscription: async () => {
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
          const userId = cryptoRandomString({ length: 10 })

          const storedCheckoutSession: CheckoutSession = {
            billingInterval,
            id: sessionId,
            userId,
            paymentStatus: 'unpaid',
            url: 'https://example.com',
            workspaceId,
            workspacePlan: PaidWorkspacePlans.Team,
            currency: 'usd',
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
            ],
            status: 'active',
            cancelAt: null,
            currentPeriodEnd: new Date()
          }

          let storedWorkspaceSubscriptionData: WorkspaceSubscription | undefined =
            undefined

          let emittedEventName: string | undefined = undefined
          let emittedEventPayload: unknown

          await completeCheckoutSessionFactory({
            getCheckoutSession: async () => storedCheckoutSession,
            updateCheckoutSessionStatus: async ({ paymentStatus }) => {
              storedCheckoutSession.paymentStatus = paymentStatus
            },
            upsertPaidWorkspacePlan: async ({ workspacePlan }) => {
              storedWorkspacePlan = workspacePlan
            },
            getWorkspacePlan: async () =>
              buildTestWorkspacePlan({ workspaceId, name: 'free' }),
            getWorkspaceSubscription: async () => null,
            getSubscriptionData: async () => subscriptionData,
            upsertWorkspaceSubscription: async ({ workspaceSubscription }) => {
              storedWorkspaceSubscriptionData = workspaceSubscription
            },
            emitEvent: async ({ eventName, payload }) => {
              emittedEventName = eventName
              emittedEventPayload = payload
            }
          })({ sessionId, subscriptionId })

          expect(storedCheckoutSession.paymentStatus).to.equal('paid')
          expect(omit(storedWorkspacePlan, 'createdAt', 'updatedAt')).to.deep.equal({
            workspaceId,
            name: storedCheckoutSession.workspacePlan,
            status: 'valid'
          })
          expect(emittedEventName).to.equal('gatekeeper.workspace-subscription-updated')
          expect(emittedEventPayload).to.nested.include({
            'workspacePlan.workspaceId': workspaceId,
            'workspacePlan.status': 'valid',
            'workspacePlan.name': storedCheckoutSession.workspacePlan,
            'previousWorkspacePlan.name': 'free',
            'previousWorkspacePlan.status': 'valid',
            'previousWorkspacePlan.workspaceId': workspaceId
          })
          expect(storedWorkspaceSubscriptionData!.billingInterval).to.equal(
            storedCheckoutSession.billingInterval
          )

          expect(storedWorkspaceSubscriptionData!.subscriptionData).to.equal(
            subscriptionData
          )
          // THIS CHECK IS BROKEN, IT ROLLS DAYS OVER, SO SOMETIMES IT SKIPS A MONTH
          // THE SOLUTION IS TO GET THE NEXT DATE FROM STRIPE ANYHOW...
          // let billingCycleEndsIn: number
          // const expectedCycleLength = 1
          // switch (billingInterval) {
          //   case 'monthly':
          //     billingCycleEndsIn =
          //       storedWorkspaceSubscriptionData!.currentBillingCycleEnd.getMonth() -
          //       new Date().getMonth()
          //     break
          //   case 'yearly':
          //     billingCycleEndsIn =
          //       storedWorkspaceSubscriptionData!.currentBillingCycleEnd.getFullYear() -
          //       new Date().getFullYear()
          //     break
          // }
          // expect(billingCycleEndsIn).to.be.equal(expectedCycleLength)
        })
      })
  })

  describe('startCheckoutSessionFactory creates a function, that', () => {
    it('does not allow checkout if workspace plan does not exists', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const userId = cryptoRandomString({ length: 10 })
      const err = await expectToThrow(() =>
        startCheckoutSessionFactory({
          getWorkspacePlan: async () => null,
          getWorkspaceCheckoutSession: () => {
            expect.fail()
          },
          countSeatsByTypeInWorkspace: () => {
            expect.fail()
          },
          createCheckoutSession: () => {
            expect.fail()
          },
          saveCheckoutSession: () => {
            expect.fail()
          },
          deleteCheckoutSession: () => {
            expect.fail()
          }
        })({
          workspaceId,
          userId,
          billingInterval: 'monthly',
          workspacePlan: 'pro',
          workspaceSlug: cryptoRandomString({ length: 10 }),
          isCreateFlow: false,
          currency: 'usd'
        })
      )
      expect(err.name).to.be.equal(new NotFoundError().name)
    })
    it('does not allow checkout for paid workspace plans, that is in a valid state', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const userId = cryptoRandomString({ length: 10 })
      const err = await expectToThrow(() =>
        startCheckoutSessionFactory({
          getWorkspacePlan: async () => ({
            name: 'team',
            status: 'valid',
            createdAt: new Date(),
            updatedAt: new Date(),
            workspaceId
          }),
          getWorkspaceCheckoutSession: () => {
            expect.fail()
          },
          countSeatsByTypeInWorkspace: () => {
            expect.fail()
          },
          createCheckoutSession: () => {
            expect.fail()
          },
          saveCheckoutSession: () => {
            expect.fail()
          },
          deleteCheckoutSession: () => {
            expect.fail()
          }
        })({
          workspaceId,
          userId,
          billingInterval: 'monthly',
          workspacePlan: 'pro',
          workspaceSlug: cryptoRandomString({ length: 10 }),
          isCreateFlow: false,
          currency: 'usd'
        })
      )
      expect(err.name).to.be.equal(new WorkspaceAlreadyPaidError().name)
    })
    it('does not allow checkout for workspace plans, that is in a paymentFailed state', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const userId = cryptoRandomString({ length: 10 })
      const err = await expectToThrow(() =>
        startCheckoutSessionFactory({
          getWorkspacePlan: async () => ({
            name: 'team',
            status: 'paymentFailed',
            createdAt: new Date(),
            updatedAt: new Date(),
            workspaceId
          }),
          getWorkspaceCheckoutSession: () => {
            expect.fail()
          },
          countSeatsByTypeInWorkspace: () => {
            expect.fail()
          },
          createCheckoutSession: () => {
            expect.fail()
          },
          deleteCheckoutSession: () => {
            expect.fail()
          },
          saveCheckoutSession: () => {
            expect.fail()
          }
        })({
          workspaceId,
          userId,
          billingInterval: 'monthly',
          workspacePlan: 'pro',
          workspaceSlug: cryptoRandomString({ length: 10 }),
          isCreateFlow: false,
          currency: 'usd'
        })
      )
      expect(err.message).to.be.equal(new WorkspaceAlreadyPaidError().message)
    })
    it('does not allow checkout for a workspace, that already has a checkout session', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const userId = cryptoRandomString({ length: 10 })
      const err = await expectToThrow(() =>
        startCheckoutSessionFactory({
          getWorkspacePlan: async () => ({
            name: 'free',
            status: 'valid',
            createdAt: new Date(),
            updatedAt: new Date(),
            workspaceId
          }),
          getWorkspaceCheckoutSession: async () => ({
            billingInterval: 'monthly',
            id: cryptoRandomString({ length: 10 }),
            paymentStatus: 'unpaid',
            url: '',
            workspaceId,
            userId,
            workspacePlan: PaidWorkspacePlans.Team,
            currency: 'usd',
            createdAt: new Date(),
            updatedAt: new Date()
          }),
          countSeatsByTypeInWorkspace: () => {
            expect.fail()
          },
          createCheckoutSession: () => {
            expect.fail()
          },

          deleteCheckoutSession: () => {
            expect.fail()
          },
          saveCheckoutSession: () => {
            expect.fail()
          }
        })({
          userId,
          workspaceId,
          billingInterval: 'monthly',
          workspacePlan: 'team',
          workspaceSlug: cryptoRandomString({ length: 10 }),
          isCreateFlow: false,
          currency: 'usd'
        })
      )
      expect(err.message).to.be.equal(
        new WorkspaceCheckoutSessionInProgressError().message
      )
    })

    it('creates and stores a checkout for FREE workspaces', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const userId = cryptoRandomString({ length: 10 })
      const workspacePlan: PaidWorkspacePlans = 'pro'
      const billingInterval: WorkspacePlanBillingIntervals = 'monthly'
      const checkoutSession: CheckoutSession = {
        id: cryptoRandomString({ length: 10 }),
        workspaceId,
        userId,
        workspacePlan,
        url: 'https://example.com',
        billingInterval,
        paymentStatus: 'unpaid',
        currency: 'usd',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      let storedCheckoutSession: CheckoutSession | undefined = undefined
      const createdCheckoutSession = await startCheckoutSessionFactory({
        getWorkspacePlan: async () => ({
          workspaceId,
          name: 'free',
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'valid'
        }),
        getWorkspaceCheckoutSession: async () => null,
        countSeatsByTypeInWorkspace: async () => 1,
        deleteCheckoutSession: () => {
          expect.fail()
        },
        createCheckoutSession: async () => checkoutSession,
        saveCheckoutSession: async ({ checkoutSession }) => {
          storedCheckoutSession = checkoutSession
        }
      })({
        workspaceId,
        userId,
        billingInterval,
        workspacePlan,
        workspaceSlug: cryptoRandomString({ length: 10 }),
        isCreateFlow: false,
        currency: 'usd'
      })
      expect(checkoutSession).deep.equal(storedCheckoutSession)
      expect(checkoutSession).deep.equal(createdCheckoutSession)
    })

    it('creates and stores a checkout for FREE workspaces even if it has an old unpaid checkout session', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const userId = cryptoRandomString({ length: 10 })
      const workspacePlan: PaidWorkspacePlans = 'team'
      const billingInterval: WorkspacePlanBillingIntervals = 'monthly'
      const checkoutSession: CheckoutSession = {
        id: cryptoRandomString({ length: 10 }),
        workspaceId,
        userId,
        workspacePlan,
        url: 'https://example.com',
        billingInterval,
        paymentStatus: 'unpaid',
        currency: 'usd',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      let existingCheckoutSession: CheckoutSession | undefined = {
        billingInterval,
        id: cryptoRandomString({ length: 10 }),
        createdAt: new Date(1990, 1, 12),
        updatedAt: new Date(1990, 1, 12),
        paymentStatus: 'unpaid',
        currency: 'usd',
        url: 'https://example.com',
        workspaceId,
        userId,
        workspacePlan
      }
      let storedCheckoutSession: CheckoutSession | undefined = undefined
      const createdCheckoutSession = await startCheckoutSessionFactory({
        getWorkspacePlan: async () => ({
          workspaceId,
          name: 'free',
          status: 'valid',
          createdAt: new Date(),
          updatedAt: new Date()
        }),
        getWorkspaceCheckoutSession: async () => existingCheckoutSession!,
        countSeatsByTypeInWorkspace: async () => 1,
        deleteCheckoutSession: async () => {
          existingCheckoutSession = undefined
        },
        createCheckoutSession: async () => checkoutSession,
        saveCheckoutSession: async ({ checkoutSession }) => {
          storedCheckoutSession = checkoutSession
        }
      })({
        workspaceId,
        userId,
        billingInterval,
        workspacePlan,
        workspaceSlug: cryptoRandomString({ length: 10 }),
        isCreateFlow: false,
        currency: 'usd'
      })
      expect(existingCheckoutSession).to.be.undefined
      expect(checkoutSession).deep.equal(storedCheckoutSession)
      expect(checkoutSession).deep.equal(createdCheckoutSession)
    })

    it('does not allow checkout for FREE workspaces if there is a paid checkout session', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const userId = cryptoRandomString({ length: 10 })
      const workspacePlan: PaidWorkspacePlans = 'pro'
      const billingInterval: WorkspacePlanBillingIntervals = 'monthly'
      let existingCheckoutSession: CheckoutSession | undefined = {
        billingInterval,
        id: cryptoRandomString({ length: 10 }),
        createdAt: new Date(1990, 1, 12),
        updatedAt: new Date(1990, 1, 12),
        paymentStatus: 'paid',
        url: 'https://example.com',
        currency: 'usd',
        workspaceId,
        userId,
        workspacePlan
      }
      const err = await expectToThrow(async () => {
        await startCheckoutSessionFactory({
          getWorkspacePlan: async () => ({
            workspaceId,
            name: 'free',
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'valid'
          }),
          getWorkspaceCheckoutSession: async () => existingCheckoutSession!,
          countSeatsByTypeInWorkspace: async () => 1,
          deleteCheckoutSession: async () => {
            existingCheckoutSession = undefined
          },
          createCheckoutSession: async () => {
            expect.fail()
          },
          saveCheckoutSession: async () => {}
        })({
          userId,
          workspaceId,
          billingInterval,
          workspacePlan,
          workspaceSlug: cryptoRandomString({ length: 10 }),
          isCreateFlow: false,
          currency: 'usd'
        })
      })
      expect(err.message).to.equal(new WorkspaceAlreadyPaidError().message)
    })

    it('creates and stores a checkout for CANCELED workspaces', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const userId = cryptoRandomString({ length: 10 })
      const workspacePlan: PaidWorkspacePlans = 'pro'
      const billingInterval: WorkspacePlanBillingIntervals = 'monthly'
      const checkoutSession: CheckoutSession = {
        id: cryptoRandomString({ length: 10 }),
        workspaceId,
        userId,
        workspacePlan,
        url: 'https://example.com',
        billingInterval,
        paymentStatus: 'unpaid',
        currency: 'usd',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      let existingCheckoutSession: CheckoutSession | undefined = {
        billingInterval: 'monthly',
        id: cryptoRandomString({ length: 10 }),
        paymentStatus: 'paid',
        url: '',
        workspaceId,
        userId,
        workspacePlan: 'team',
        currency: 'usd',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      let storedCheckoutSession: CheckoutSession | undefined = undefined
      const createdCheckoutSession = await startCheckoutSessionFactory({
        getWorkspacePlan: async () => ({
          name: 'team',
          workspaceId,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'canceled'
        }),
        getWorkspaceCheckoutSession: async () => existingCheckoutSession!,
        countSeatsByTypeInWorkspace: async () => 1,
        deleteCheckoutSession: async () => {
          existingCheckoutSession = undefined
        },
        createCheckoutSession: async () => checkoutSession,
        saveCheckoutSession: async ({ checkoutSession }) => {
          storedCheckoutSession = checkoutSession
        }
      })({
        workspaceId,
        userId,
        billingInterval,
        workspacePlan,
        workspaceSlug: cryptoRandomString({ length: 10 }),
        isCreateFlow: false,
        currency: 'usd'
      })
      expect(existingCheckoutSession).to.be.undefined
      expect(checkoutSession).deep.equal(storedCheckoutSession)
      expect(checkoutSession).deep.equal(createdCheckoutSession)
    })
  })
})
