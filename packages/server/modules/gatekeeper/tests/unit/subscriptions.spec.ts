import {
  SubscriptionData,
  SubscriptionDataInput,
  SubscriptionUpdateIntent,
  WorkspaceSeatType,
  WorkspaceSubscription
} from '@/modules/gatekeeper/domain/billing'
import {
  WorkspaceNotPaidPlanError,
  WorkspacePlanMismatchError,
  WorkspacePlanNotFoundError,
  WorkspaceSubscriptionNotFoundError
} from '@/modules/gatekeeper/errors/billing'
import {
  addWorkspaceSubscriptionSeatIfNeededFactory,
  getTotalSeatsCountByPlanFactory,
  handleSubscriptionUpdateFactory
} from '@/modules/gatekeeper/services/subscriptions'
import { downscaleWorkspaceSubscriptionFactory } from '@/modules/gatekeeper/services/subscriptions/manageSubscriptionDownscale'

import {
  createTestSubscriptionData,
  createTestWorkspaceSubscription
} from '@/modules/gatekeeper/tests/helpers'
import { expectToThrow } from '@/test/assertionHelper'
import { PaidWorkspacePlans, throwUncoveredError, WorkspacePlan } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import { omit } from 'lodash-es'
import { upgradeWorkspaceSubscriptionFactory } from '@/modules/gatekeeper/services/subscriptions/upgradeWorkspaceSubscription'
import { EventBusEmit } from '@/modules/shared/services/eventBus'
import { testLogger } from '@/observability/logging'
import { mutateSubscriptionDataWithNewValidSeatNumbers } from '@/modules/gatekeeper/services/subscriptions/mutateSubscriptionDataWithNewValidSeatNumbers'

describe('subscriptions @gatekeeper', () => {
  describe('handleSubscriptionUpdateFactory creates a function, that', () => {
    it('throws if subscription is not found and status is not incomplete', async () => {
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
          },
          emitEvent: async () => {
            expect.fail()
          }
        })({ subscriptionData, logger: testLogger })
      })
      expect(err.message).to.equal(new WorkspaceSubscriptionNotFoundError().message)
    })
    it('returns if subscription is not found and status is incomplete', async () => {
      const subscriptionData = createTestSubscriptionData()
      subscriptionData.status = 'incomplete'
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
        },
        emitEvent: async () => {
          expect.fail()
        }
      })({ subscriptionData, logger: testLogger })
    })
    it('throws if workspacePlan is not found', async () => {
      const subscriptionData = createTestSubscriptionData()
      const err = await expectToThrow(async () => {
        await handleSubscriptionUpdateFactory({
          getWorkspaceSubscriptionBySubscriptionId: async () =>
            createTestWorkspaceSubscription({ subscriptionData }),
          getWorkspacePlan: async () => null,
          upsertWorkspaceSubscription: async () => {
            expect.fail()
          },
          upsertPaidWorkspacePlan: async () => {
            expect.fail()
          },
          emitEvent: async () => {
            expect.fail()
          }
        })({ subscriptionData, logger: testLogger })
      })
      expect(err.message).to.equal(new WorkspacePlanNotFoundError().message)
    })
    ;(['unlimited', 'academia'] as const).forEach((name) =>
      it(`throws for non paid workspace plan: ${name}`, async () => {
        const subscriptionData = createTestSubscriptionData()
        const workspaceId = cryptoRandomString({ length: 10 })
        const err = await expectToThrow(async () => {
          await handleSubscriptionUpdateFactory({
            getWorkspaceSubscriptionBySubscriptionId: async () =>
              createTestWorkspaceSubscription({
                subscriptionData,
                workspaceId
              }),
            getWorkspacePlan: async () => ({
              name,
              workspaceId,
              createdAt: new Date(),
              updatedAt: new Date(),
              status: 'valid'
            }),
            upsertWorkspaceSubscription: async () => {
              expect.fail()
            },
            upsertPaidWorkspacePlan: async () => {
              expect.fail()
            },
            emitEvent: async () => {
              expect.fail()
            }
          })({ subscriptionData, logger: testLogger })
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
      const workspaceSubscription = createTestWorkspaceSubscription({
        subscriptionData,
        workspaceId
      })

      let updatedSubscription: WorkspaceSubscription | undefined = undefined
      let updatedPlan: WorkspacePlan | undefined = undefined
      let emittedEventName: string | undefined = undefined
      let emittedEventPayload: unknown = undefined
      const emitEvent: EventBusEmit = async ({ eventName, payload }) => {
        emittedEventName = eventName
        emittedEventPayload = payload
      }

      await handleSubscriptionUpdateFactory({
        getWorkspaceSubscriptionBySubscriptionId: async () => workspaceSubscription,
        getWorkspacePlan: async () => ({
          name: PaidWorkspacePlans.Team,
          workspaceId,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'valid'
        }),
        upsertWorkspaceSubscription: async ({ workspaceSubscription }) => {
          updatedSubscription = workspaceSubscription
        },
        upsertPaidWorkspacePlan: async ({ workspacePlan }) => {
          updatedPlan = workspacePlan
        },
        emitEvent
      })({ subscriptionData, logger: testLogger })
      expect(updatedPlan!.status).to.be.equal('cancelationScheduled')
      expect(updatedSubscription!.updatedAt).to.be.greaterThanOrEqual(
        workspaceSubscription.updatedAt
      )
      expect(omit(updatedSubscription!, 'updatedAt')).deep.equal(
        omit(workspaceSubscription, 'updatedAt')
      )
      expect(emittedEventName).to.eq('gatekeeper.workspace-subscription-updated')
      expect(emittedEventPayload).to.have.nested.include({
        'workspacePlan.status': 'cancelationScheduled'
      })
      expect(emittedEventPayload).to.have.nested.include({
        'subscription.totalEditorSeats': 3
      })
      expect(emittedEventPayload).to.have.nested.include({
        'previousSubscription.totalEditorSeats': 3
      })
    })
    it('sets the status to valid', async () => {
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
        updateIntent: null,
        currency: 'usd' as const,
        currentBillingCycleEnd: new Date(),
        workspaceId
      }

      let updatedSubscription: WorkspaceSubscription | undefined = undefined
      let updatedPlan: WorkspacePlan | undefined = undefined
      let emittedEventName: string | undefined = undefined
      let emittedEventPayload: unknown = undefined
      const emitEvent: EventBusEmit = async ({ eventName, payload }) => {
        emittedEventName = eventName
        emittedEventPayload = payload
      }

      await handleSubscriptionUpdateFactory({
        getWorkspaceSubscriptionBySubscriptionId: async () => workspaceSubscription,
        getWorkspacePlan: async () => ({
          name: PaidWorkspacePlans.Team,
          workspaceId,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'paymentFailed'
        }),
        upsertWorkspaceSubscription: async ({ workspaceSubscription }) => {
          updatedSubscription = workspaceSubscription
        },
        upsertPaidWorkspacePlan: async ({ workspacePlan }) => {
          updatedPlan = workspacePlan
        },
        emitEvent
      })({ subscriptionData, logger: testLogger })
      expect(updatedPlan!.status).to.be.equal('valid')
      expect(updatedSubscription!.updatedAt).to.be.greaterThanOrEqual(
        workspaceSubscription.updatedAt
      )
      expect(omit(updatedSubscription!, 'updatedAt')).deep.equal(
        omit(workspaceSubscription, 'updatedAt')
      )
      expect(emittedEventName).to.eq('gatekeeper.workspace-subscription-updated')
      expect(emittedEventPayload).to.have.nested.include({
        'workspacePlan.status': 'valid'
      })
      expect(emittedEventPayload).to.have.nested.include({
        'subscription.totalEditorSeats': 3
      })
      expect(emittedEventPayload).to.have.nested.include({
        'previousSubscription.totalEditorSeats': 3
      })
    })
    it('updates the plan with the subscription update intent', async () => {
      const subscriptionData = createTestSubscriptionData({
        status: 'active',
        cancelAt: null
      })
      const workspaceId = cryptoRandomString({ length: 10 })
      const userId = cryptoRandomString({ length: 10 })
      const now = new Date()
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      const inOneYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)

      const workspaceSubscription = {
        subscriptionData,
        billingInterval: 'monthly' as const,
        createdAt: oneMonthAgo,
        updatedAt: oneMonthAgo,
        updateIntent: {
          userId,
          planName: 'proUnlimited' as const,
          billingInterval: 'yearly' as const,
          currentBillingCycleEnd: inOneYear,
          updatedAt: now,
          currency: 'usd' as const,
          products: [
            {
              priceId: subscriptionData.products[0].priceId,
              productId: subscriptionData.products[0].productId,
              quantity: subscriptionData.products[0].quantity
            }
          ]
        },
        currency: 'usd' as const,
        currentBillingCycleEnd: new Date(),
        workspaceId
      }

      let updatedSubscription: WorkspaceSubscription | undefined = undefined
      let updatedPlan: WorkspacePlan | undefined = undefined
      let emittedEventName: string | undefined = undefined
      let emittedEventPayload: unknown = undefined
      const emitEvent: EventBusEmit = async ({ eventName, payload }) => {
        emittedEventName = eventName
        emittedEventPayload = payload
      }

      await handleSubscriptionUpdateFactory({
        getWorkspaceSubscriptionBySubscriptionId: async () => workspaceSubscription,
        getWorkspacePlan: async () => ({
          name: PaidWorkspacePlans.Team,
          workspaceId,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'paymentFailed'
        }),
        upsertWorkspaceSubscription: async ({ workspaceSubscription }) => {
          updatedSubscription = workspaceSubscription
        },
        upsertPaidWorkspacePlan: async ({ workspacePlan }) => {
          updatedPlan = workspacePlan
        },
        emitEvent
      })({ subscriptionData, logger: testLogger })
      expect(updatedPlan!.name).to.be.equal('proUnlimited')
      expect(updatedPlan!.status).to.be.equal('valid')
      expect(updatedSubscription).to.be.deep.equal({
        workspaceId,
        billingInterval: 'yearly',
        currentBillingCycleEnd: inOneYear,
        updateIntent: null,
        currency: 'usd',
        updatedAt: now,
        createdAt: oneMonthAgo,
        subscriptionData
      })
      expect(emittedEventName).to.eq('gatekeeper.workspace-subscription-updated')
      expect(emittedEventPayload).to.have.nested.include({
        'workspacePlan.status': 'valid'
      })
      expect(emittedEventPayload).to.have.nested.include({
        'subscription.totalEditorSeats': 3
      })
      expect(emittedEventPayload).to.have.nested.include({
        'previousSubscription.totalEditorSeats': 3
      })
    })
    it('sets the state to paymentFailed', async () => {
      const subscriptionData = createTestSubscriptionData({
        status: 'past_due'
      })
      const workspaceId = cryptoRandomString({ length: 10 })

      const workspaceSubscription = createTestWorkspaceSubscription({
        subscriptionData,
        workspaceId
      })

      let updatedSubscription: WorkspaceSubscription | undefined = undefined
      let updatedPlan: WorkspacePlan | undefined = undefined
      let emittedEventName: string | undefined = undefined
      let emittedEventPayload: unknown = undefined
      const emitEvent: EventBusEmit = async ({ eventName, payload }) => {
        emittedEventName = eventName
        emittedEventPayload = payload
      }

      await handleSubscriptionUpdateFactory({
        getWorkspaceSubscriptionBySubscriptionId: async () => workspaceSubscription,
        getWorkspacePlan: async () => ({
          name: PaidWorkspacePlans.Team,
          workspaceId,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'valid'
        }),
        upsertWorkspaceSubscription: async ({ workspaceSubscription }) => {
          updatedSubscription = workspaceSubscription
        },
        upsertPaidWorkspacePlan: async ({ workspacePlan }) => {
          updatedPlan = workspacePlan
        },
        emitEvent
      })({ subscriptionData, logger: testLogger })
      expect(updatedPlan!.status).to.be.equal('paymentFailed')
      expect(updatedSubscription!.updatedAt).to.be.greaterThanOrEqual(
        workspaceSubscription.updatedAt
      )
      expect(omit(updatedSubscription!, 'updatedAt')).deep.equal(
        omit(workspaceSubscription, 'updatedAt')
      )
      expect(emittedEventName).to.eq('gatekeeper.workspace-subscription-updated')
      expect(emittedEventPayload).to.have.nested.include({
        'workspacePlan.status': 'paymentFailed'
      })
      expect(emittedEventPayload).to.have.nested.include({
        'subscription.totalEditorSeats': 3
      })
      expect(emittedEventPayload).to.have.nested.include({
        'previousSubscription.totalEditorSeats': 3
      })
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
        updateIntent: null,
        currency: 'usd' as const,
        currentBillingCycleEnd: new Date(),
        workspaceId
      }

      let updatedSubscription: WorkspaceSubscription | undefined = undefined
      let updatedPlan: WorkspacePlan | undefined = undefined
      let emittedEventName: string | undefined = undefined
      let emittedEventPayload: unknown = undefined
      const emitEvent: EventBusEmit = async ({ eventName, payload }) => {
        emittedEventName = eventName
        emittedEventPayload = payload
      }

      await handleSubscriptionUpdateFactory({
        getWorkspaceSubscriptionBySubscriptionId: async () => workspaceSubscription,
        getWorkspacePlan: async () => ({
          name: PaidWorkspacePlans.Team,
          workspaceId,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'valid'
        }),
        upsertWorkspaceSubscription: async ({ workspaceSubscription }) => {
          updatedSubscription = workspaceSubscription
        },
        upsertPaidWorkspacePlan: async ({ workspacePlan }) => {
          updatedPlan = workspacePlan
        },
        emitEvent
      })({ subscriptionData, logger: testLogger })
      expect(updatedPlan!.status).to.be.equal('canceled')
      expect(updatedSubscription!.updatedAt).to.be.greaterThanOrEqual(
        workspaceSubscription.updatedAt
      )
      expect(omit(updatedSubscription!, 'updatedAt')).deep.equal(
        omit(workspaceSubscription, 'updatedAt')
      )
      expect(emittedEventName).to.eq('gatekeeper.workspace-subscription-updated')
      expect(emittedEventPayload).to.have.nested.include({
        'workspacePlan.status': 'canceled'
      })
      expect(emittedEventPayload).to.have.nested.include({
        'subscription.totalEditorSeats': 3
      })
      expect(emittedEventPayload).to.have.nested.include({
        'previousSubscription.totalEditorSeats': 3
      })
    })
    ;(
      ['incomplete', 'incomplete_expired', 'trialing', 'unpaid', 'paused'] as const
    ).forEach((status) => {
      it(`does not update the plan or the subscription in case of an unhandled status: ${status}`, async () => {
        const subscriptionData = createTestSubscriptionData({
          status
        })
        const workspaceId = cryptoRandomString({ length: 10 })

        const workspaceSubscription = createTestWorkspaceSubscription({
          subscriptionData,
          workspaceId
        })

        await handleSubscriptionUpdateFactory({
          getWorkspaceSubscriptionBySubscriptionId: async () => workspaceSubscription,
          getWorkspacePlan: async () => ({
            name: PaidWorkspacePlans.Team,
            workspaceId,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'valid'
          }),
          upsertWorkspaceSubscription: async () => {
            expect.fail()
          },
          upsertPaidWorkspacePlan: async () => {
            expect.fail()
          },
          emitEvent: async () => {
            expect.fail()
          }
        })({ subscriptionData, logger: testLogger })
      })
    })
  })

  describe('addWorkspaceSubscriptionSeatIfNeededFactory returns a function, that', () => {
    it('just returns if the workspacePlan is not found', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const updatedByUserId = cryptoRandomString({ length: 10 })
      const addWorkspaceSubscriptionSeatIfNeeded =
        addWorkspaceSubscriptionSeatIfNeededFactory({
          getWorkspacePlan: async () => null,
          getWorkspaceSubscription: async () => {
            expect.fail()
          },
          getWorkspacePlanPriceId: () => {
            expect.fail()
          },
          getWorkspacePlanProductId: () => {
            expect.fail()
          },
          reconcileSubscriptionData: async () => {
            expect.fail()
          },
          countSeatsByTypeInWorkspace: async () => 0,
          upsertWorkspaceSubscription: async () => {}
        })
      await addWorkspaceSubscriptionSeatIfNeeded({
        updatedByUserId,
        workspaceId,
        seatType: WorkspaceSeatType.Editor
      })
      expect(true).to.be.true
    })
    it('returns if the workspaceSubscription is not found', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const updatedByUserId = cryptoRandomString({ length: 10 })
      const addWorkspaceSubscriptionSeatIfNeeded =
        addWorkspaceSubscriptionSeatIfNeededFactory({
          getWorkspacePlan: async () => ({
            name: 'free',
            workspaceId,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'valid'
          }),
          getWorkspaceSubscription: async () => null,
          getWorkspacePlanPriceId: () => {
            expect.fail()
          },
          getWorkspacePlanProductId: () => {
            expect.fail()
          },
          reconcileSubscriptionData: async () => {
            expect.fail()
          },
          countSeatsByTypeInWorkspace: async () => 0,
          upsertWorkspaceSubscription: async () => {}
        })

      await addWorkspaceSubscriptionSeatIfNeeded({
        updatedByUserId,
        workspaceId,
        seatType: WorkspaceSeatType.Editor
      })
    })
    it('throws if a non paid plan, has a subscription', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const updatedByUserId = cryptoRandomString({ length: 10 })
      const subscriptionData = createTestSubscriptionData({ products: [] })
      const workspaceSubscription = createTestWorkspaceSubscription({
        workspaceId,
        subscriptionData
      })
      const addWorkspaceSubscriptionSeatIfNeeded =
        addWorkspaceSubscriptionSeatIfNeededFactory({
          getWorkspacePlan: async () => ({
            name: 'free',
            workspaceId,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'valid'
          }),
          getWorkspaceSubscription: async () => workspaceSubscription,
          getWorkspacePlanPriceId: () => {
            expect.fail()
          },
          getWorkspacePlanProductId: () => {
            expect.fail()
          },
          reconcileSubscriptionData: async () => {
            expect.fail()
          },
          countSeatsByTypeInWorkspace: async () => 0,
          upsertWorkspaceSubscription: async () => {}
        })
      const err = await expectToThrow(async () => {
        await addWorkspaceSubscriptionSeatIfNeeded({
          updatedByUserId,
          workspaceId,
          seatType: WorkspaceSeatType.Editor
        })
      })
      expect(err.message).to.equal(new WorkspacePlanMismatchError().message)
    })
    it('returns without reconciliation if the subscription is canceled', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const updatedByUserId = cryptoRandomString({ length: 10 })
      const subscriptionData = createTestSubscriptionData({ products: [] })
      const workspaceSubscription = createTestWorkspaceSubscription({
        workspaceId,
        subscriptionData
      })
      const addWorkspaceSubscriptionSeatIfNeeded =
        addWorkspaceSubscriptionSeatIfNeededFactory({
          getWorkspacePlan: async () => ({
            name: 'team',
            workspaceId,
            createdAt: new Date(),
            updatedAt: new Date(),
            status: 'canceled'
          }),
          getWorkspaceSubscription: async () => workspaceSubscription,
          getWorkspacePlanPriceId: () => {
            expect.fail()
          },
          getWorkspacePlanProductId: () => {
            expect.fail()
          },
          reconcileSubscriptionData: async () => {
            expect.fail()
          },
          countSeatsByTypeInWorkspace: async () => 0,
          upsertWorkspaceSubscription: async () => {}
        })
      await addWorkspaceSubscriptionSeatIfNeeded({
        updatedByUserId,
        workspaceId,
        seatType: WorkspaceSeatType.Editor
      })
    })
    it('uses the relevant seat count, product and price id', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const updatedByUserId = cryptoRandomString({ length: 10 })
      const subscriptionData = createTestSubscriptionData({ products: [] })
      const workspaceSubscription = createTestWorkspaceSubscription({
        workspaceId,
        subscriptionData
      })
      const workspacePlan: WorkspacePlan = {
        name: 'team',
        workspaceId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'valid'
      }
      const priceId = cryptoRandomString({ length: 10 })
      const productId = cryptoRandomString({ length: 10 })
      const roleCount = 10

      let reconciledSubscriptionData: SubscriptionDataInput | undefined = undefined
      const addWorkspaceSubscriptionSeatIfNeeded =
        addWorkspaceSubscriptionSeatIfNeededFactory({
          getWorkspacePlan: async () => workspacePlan,
          getWorkspaceSubscription: async () => workspaceSubscription,
          getWorkspacePlanPriceId: ({ workspacePlan, billingInterval }) => {
            if (billingInterval !== workspaceSubscription.billingInterval) expect.fail()
            switch (workspacePlan) {
              case 'pro':
              case 'teamUnlimited':
              case 'proUnlimited':
                expect.fail()
              case 'team':
                return priceId
              default:
                throwUncoveredError(workspacePlan)
            }
          },
          getWorkspacePlanProductId: (args) => {
            if (args.workspacePlan !== 'team') expect.fail()
            return productId
          },
          reconcileSubscriptionData: async ({
            prorationBehavior,
            subscriptionData
          }) => {
            if (prorationBehavior !== 'always_invoice') expect.fail()
            reconciledSubscriptionData = subscriptionData
          },
          countSeatsByTypeInWorkspace: async () => roleCount,
          upsertWorkspaceSubscription: async () => {}
        })
      await addWorkspaceSubscriptionSeatIfNeeded({
        updatedByUserId,
        workspaceId,
        seatType: WorkspaceSeatType.Editor
      })

      expect(reconciledSubscriptionData).to.be.ok
      expect(reconciledSubscriptionData!.products).deep.equalInAnyOrder([
        { productId, priceId, quantity: roleCount }
      ])
    })

    it('updates the sub existing product quantity if the one matching the new seat type, does not have enough quantities', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const updatedByUserId = cryptoRandomString({ length: 10 })
      const priceId = cryptoRandomString({ length: 10 })
      const productId = cryptoRandomString({ length: 10 })
      const subscriptionItemId = cryptoRandomString({ length: 10 })
      const subscriptionData = createTestSubscriptionData({
        products: [
          {
            priceId,
            productId,
            quantity: 5,
            subscriptionItemId
          }
        ]
      })
      const workspaceSubscription = createTestWorkspaceSubscription({
        workspaceId,
        subscriptionData
      })
      const workspacePlan: WorkspacePlan = {
        name: 'team',
        workspaceId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'valid'
      }
      const roleCount = 10

      let reconciledSubscriptionData: SubscriptionDataInput | undefined = undefined
      const addWorkspaceSubscriptionSeatIfNeeded =
        addWorkspaceSubscriptionSeatIfNeededFactory({
          getWorkspacePlan: async () => workspacePlan,
          getWorkspaceSubscription: async () => workspaceSubscription,
          getWorkspacePlanPriceId: ({ workspacePlan, billingInterval }) => {
            if (billingInterval !== workspaceSubscription.billingInterval) expect.fail()
            switch (workspacePlan) {
              case 'pro':
              case 'teamUnlimited':
              case 'proUnlimited':
                expect.fail()
              case 'team':
                return priceId
              default:
                throwUncoveredError(workspacePlan)
            }
          },
          getWorkspacePlanProductId: (args) => {
            if (args.workspacePlan !== workspacePlan.name) expect.fail()
            return productId
          },
          reconcileSubscriptionData: async ({
            prorationBehavior,
            subscriptionData
          }) => {
            if (prorationBehavior !== 'always_invoice') expect.fail()
            reconciledSubscriptionData = subscriptionData
          },
          countSeatsByTypeInWorkspace: async () => roleCount,
          upsertWorkspaceSubscription: async () => {}
        })
      await addWorkspaceSubscriptionSeatIfNeeded({
        updatedByUserId,
        workspaceId,
        seatType: WorkspaceSeatType.Editor
      })
      expect(reconciledSubscriptionData!.products).deep.equalInAnyOrder([
        { productId, priceId, quantity: roleCount, subscriptionItemId }
      ])
    })
    it('does not update the subscription if the product matching the new role, has enough quantities', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const updatedByUserId = cryptoRandomString({ length: 10 })
      const priceId = cryptoRandomString({ length: 10 })
      const productId = cryptoRandomString({ length: 10 })
      const subscriptionItemId = cryptoRandomString({ length: 10 })
      const subscriptionData = createTestSubscriptionData({
        products: [
          {
            priceId,
            productId,
            quantity: 2,
            subscriptionItemId
          }
        ]
      })
      const workspaceSubscription = createTestWorkspaceSubscription({
        workspaceId,
        subscriptionData
      })
      const workspacePlan: WorkspacePlan = {
        name: 'team',
        workspaceId,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'valid'
      }
      const count = 1

      const addWorkspaceSubscriptionSeatIfNeeded =
        addWorkspaceSubscriptionSeatIfNeededFactory({
          getWorkspacePlan: async () => workspacePlan,
          getWorkspaceSubscription: async () => workspaceSubscription,
          getWorkspacePlanPriceId: ({ workspacePlan, billingInterval }) => {
            if (billingInterval !== workspaceSubscription.billingInterval) expect.fail()
            switch (workspacePlan) {
              case 'pro':
              case 'teamUnlimited':
              case 'proUnlimited':
                expect.fail()
              case 'team':
                return priceId
              default:
                throwUncoveredError(workspacePlan)
            }
          },
          getWorkspacePlanProductId: (args) => {
            if (args.workspacePlan !== workspacePlan.name) expect.fail()
            return productId
          },
          reconcileSubscriptionData: async () => {
            expect.fail()
          },
          countSeatsByTypeInWorkspace: async () => count,
          upsertWorkspaceSubscription: async () => {}
        })
      await addWorkspaceSubscriptionSeatIfNeeded({
        updatedByUserId,
        workspaceId,
        seatType: WorkspaceSeatType.Editor
      })
    })
  })

  describe('mutateSubscriptionDataWithNewValidSeats', () => {
    it('can totally downscale the subscription', () => {
      const desiredSeatCount = 0
      const productId = cryptoRandomString({ length: 10 })
      const priceId = cryptoRandomString({ length: 10 })
      const subscriptionItemId = cryptoRandomString({ length: 10 })
      const currentQuantity = 2
      const subscriptionData = createTestSubscriptionData({
        products: [
          { priceId, productId, quantity: currentQuantity, subscriptionItemId }
        ]
      })

      mutateSubscriptionDataWithNewValidSeatNumbers({
        seatCount: desiredSeatCount,
        workspacePlan: PaidWorkspacePlans.Team,
        getWorkspacePlanProductId: () => productId,
        subscriptionData
      })

      expect(subscriptionData.products).to.has.lengthOf(0)
    })

    it('mutates the quantity when the count is less than the one given', () => {
      const desiredSeatCount = 5
      const productId = cryptoRandomString({ length: 10 })
      const priceId = cryptoRandomString({ length: 10 })
      const subscriptionItemId = cryptoRandomString({ length: 10 })
      const currentQuantity = 10
      const subscriptionData = createTestSubscriptionData({
        products: [
          { priceId, productId, quantity: currentQuantity, subscriptionItemId }
        ]
      })

      mutateSubscriptionDataWithNewValidSeatNumbers({
        seatCount: desiredSeatCount,
        workspacePlan: PaidWorkspacePlans.Team,
        getWorkspacePlanProductId: () => productId,
        subscriptionData
      })

      expect(subscriptionData.products[0].quantity).to.be.equal(desiredSeatCount)
    })

    it('throws an exception to notify that instead of downscale, a subscription is broken and an upscale is required', () => {
      const desiredSeatCount = 10
      const currentQuantity = 5
      const productId = cryptoRandomString({ length: 10 })
      const priceId = cryptoRandomString({ length: 10 })
      const subscriptionItemId = cryptoRandomString({ length: 10 })
      const subscriptionData = createTestSubscriptionData({
        products: [
          { priceId, productId, quantity: currentQuantity, subscriptionItemId }
        ]
      })

      const mutation = () =>
        mutateSubscriptionDataWithNewValidSeatNumbers({
          seatCount: desiredSeatCount,
          workspacePlan: PaidWorkspacePlans.Team,
          getWorkspacePlanProductId: () => productId,
          subscriptionData
        })

      expect(mutation).to.throw('Subscription missing an upscale')
    })

    it('throws an exception when the subscription is malformed', () => {
      const desiredSeatCount = 10
      const productId = cryptoRandomString({ length: 10 })
      const subscriptionData = createTestSubscriptionData({
        products: []
      })

      const mutation = () =>
        mutateSubscriptionDataWithNewValidSeatNumbers({
          seatCount: desiredSeatCount,
          workspacePlan: PaidWorkspacePlans.Team,
          getWorkspacePlanProductId: () => productId,
          subscriptionData
        })

      expect(mutation).to.throw('Product not found at mutation')
    })
  })

  describe('downscaleWorkspaceSubscriptionFactory creates a function, that', () => {
    it('throws an error if the workspace has no plan attached to it', async () => {
      const subscriptionData = createTestSubscriptionData()
      const workspaceSubscription = createTestWorkspaceSubscription({
        subscriptionData
      })
      const downscaleSubscription = downscaleWorkspaceSubscriptionFactory({
        getWorkspacePlan: async () => null,
        countSeatsByTypeInWorkspace: async () => {
          expect.fail()
        },
        getWorkspacePlanProductId: () => {
          expect.fail()
        },
        reconcileSubscriptionData: async () => {
          expect.fail()
        }
      })
      const err = await expectToThrow(async () => {
        await downscaleSubscription({ workspaceSubscription })
      })
      expect(err.message).to.equal(new WorkspacePlanNotFoundError().message)
    })
    it('throws an error if workspacePlan is not a paid plan', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const subscriptionData = createTestSubscriptionData()
      const workspaceSubscription = createTestWorkspaceSubscription({
        subscriptionData,
        workspaceId
      })
      const downscaleSubscription = downscaleWorkspaceSubscriptionFactory({
        getWorkspacePlan: async () => ({
          name: 'unlimited',
          workspaceId,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'valid'
        }),
        countSeatsByTypeInWorkspace: async () => {
          expect.fail()
        },
        getWorkspacePlanProductId: () => {
          expect.fail()
        },
        reconcileSubscriptionData: async () => {
          expect.fail()
        }
      })
      const err = await expectToThrow(async () => {
        await downscaleSubscription({ workspaceSubscription })
      })
      expect(err.message).to.equal(new WorkspacePlanMismatchError().message)
    })
    it('returns if the subscription is canceled', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const subscriptionData = createTestSubscriptionData()
      const workspaceSubscription = createTestWorkspaceSubscription({
        subscriptionData,
        workspaceId
      })
      const downscaleSubscription = downscaleWorkspaceSubscriptionFactory({
        getWorkspacePlan: async () => ({
          name: PaidWorkspacePlans.Team,
          workspaceId,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'canceled'
        }),
        countSeatsByTypeInWorkspace: async () => {
          expect.fail()
        },
        getWorkspacePlanProductId: () => {
          expect.fail()
        },
        reconcileSubscriptionData: async () => {
          expect.fail()
        }
      })
      const hasDownscaled = await downscaleSubscription({ workspaceSubscription })
      expect(hasDownscaled).to.be.false
    })
    it('does not reconcile the subscription if seats did not change', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const priceId = cryptoRandomString({ length: 10 })
      const productId = cryptoRandomString({ length: 10 })
      const quantity = 10
      const subscriptionItemId = cryptoRandomString({ length: 10 })
      const subscriptionData = createTestSubscriptionData({
        products: [{ priceId, productId, quantity, subscriptionItemId }]
      })
      const workspaceSubscription = createTestWorkspaceSubscription({
        subscriptionData,
        billingInterval: 'monthly',
        currentBillingCycleEnd: new Date(2034, 11, 5),
        workspaceId
      })
      const workspacePlanName = PaidWorkspacePlans.Team
      const downscaleSubscription = downscaleWorkspaceSubscriptionFactory({
        getWorkspacePlan: async () => ({
          name: workspacePlanName,
          workspaceId,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'valid'
        }),
        countSeatsByTypeInWorkspace: async ({ type }) => {
          return type === WorkspaceSeatType.Viewer ? 0 : quantity
        },
        getWorkspacePlanProductId: ({ workspacePlan }) => {
          return workspacePlan === workspacePlanName
            ? productId
            : cryptoRandomString({ length: 10 })
        },
        reconcileSubscriptionData: async () => {
          expect.fail()
        }
      })
      await downscaleSubscription({ workspaceSubscription })
    })
    it('reconciles the subscription to the new seat values', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const priceId = cryptoRandomString({ length: 10 })
      const productId = cryptoRandomString({ length: 10 })
      const editorQty = 10
      const proSubscriptionItemId = cryptoRandomString({ length: 10 })
      const subscriptionData = createTestSubscriptionData({
        products: [
          {
            priceId,
            productId,
            quantity: editorQty,
            subscriptionItemId: proSubscriptionItemId
          }
        ]
      })
      const testWorkspaceSubscription = createTestWorkspaceSubscription({
        subscriptionData,
        workspaceId
      })
      const workspacePlanName = PaidWorkspacePlans.Team

      let reconciledSub: SubscriptionDataInput | undefined = undefined
      const downscaleSubscription = downscaleWorkspaceSubscriptionFactory({
        getWorkspacePlan: async () => ({
          name: workspacePlanName,
          workspaceId,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'valid'
        }),
        countSeatsByTypeInWorkspace: async ({ type }) => {
          return type === WorkspaceSeatType.Viewer ? 0 : editorQty / 2
        },
        getWorkspacePlanProductId: () => {
          return productId
        },
        reconcileSubscriptionData: async ({ subscriptionData }) => {
          reconciledSub = subscriptionData
        }
      })
      await downscaleSubscription({ workspaceSubscription: testWorkspaceSubscription })

      expect(
        reconciledSub!.products.find((p) => p.productId === productId)?.quantity
      ).to.be.equal(editorQty / 2)
    })
  })
  describe('downscaleWorkspaceSubscriptionFactory creates a function, that', () => {
    it('throws an error if the workspace has no plan attached to it', async () => {
      const subscriptionData = createTestSubscriptionData()
      const workspaceSubscription = createTestWorkspaceSubscription({
        subscriptionData
      })
      const downscaleSubscription = downscaleWorkspaceSubscriptionFactory({
        getWorkspacePlan: async () => null,
        countSeatsByTypeInWorkspace: async () => {
          expect.fail()
        },
        getWorkspacePlanProductId: () => {
          expect.fail()
        },
        reconcileSubscriptionData: async () => {
          expect.fail()
        }
      })
      const err = await expectToThrow(async () => {
        await downscaleSubscription({ workspaceSubscription })
      })
      expect(err.message).to.equal(new WorkspacePlanNotFoundError().message)
    })
    it('throws an error if workspacePlan is not a paid plan', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const subscriptionData = createTestSubscriptionData()
      const workspaceSubscription = createTestWorkspaceSubscription({
        subscriptionData,
        workspaceId
      })
      const downscaleSubscription = downscaleWorkspaceSubscriptionFactory({
        getWorkspacePlan: async () => ({
          name: 'unlimited',
          workspaceId,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'valid'
        }),
        countSeatsByTypeInWorkspace: async () => {
          expect.fail()
        },
        getWorkspacePlanProductId: () => {
          expect.fail()
        },
        reconcileSubscriptionData: async () => {
          expect.fail()
        }
      })
      const err = await expectToThrow(async () => {
        await downscaleSubscription({ workspaceSubscription })
      })
      expect(err.message).to.equal(new WorkspacePlanMismatchError().message)
    })
    it('returns if the subscription is canceled', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const subscriptionData = createTestSubscriptionData()
      const workspaceSubscription = createTestWorkspaceSubscription({
        subscriptionData,
        workspaceId
      })
      const downscaleSubscription = downscaleWorkspaceSubscriptionFactory({
        getWorkspacePlan: async () => ({
          name: 'pro',
          workspaceId,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'canceled'
        }),
        countSeatsByTypeInWorkspace: async () => {
          expect.fail()
        },
        getWorkspacePlanProductId: () => {
          expect.fail()
        },
        reconcileSubscriptionData: async () => {
          expect.fail()
        }
      })
      const hasDownscaled = await downscaleSubscription({ workspaceSubscription })
      expect(hasDownscaled).to.be.false
    })
    it('does not reconcile the subscription seats did not change', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const priceId = cryptoRandomString({ length: 10 })
      const productId = cryptoRandomString({ length: 10 })
      const quantity = 10
      const subscriptionItemId = cryptoRandomString({ length: 10 })
      const subscriptionData = createTestSubscriptionData({
        products: [{ priceId, productId, quantity, subscriptionItemId }]
      })
      const workspaceSubscription = createTestWorkspaceSubscription({
        subscriptionData,
        billingInterval: 'monthly',
        currentBillingCycleEnd: new Date(2034, 11, 5),
        workspaceId
      })
      const workspacePlanName = 'pro'
      const downscaleSubscription = downscaleWorkspaceSubscriptionFactory({
        getWorkspacePlan: async () => ({
          name: workspacePlanName,
          workspaceId,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'valid'
        }),
        countSeatsByTypeInWorkspace: async () => {
          return 10
        },
        getWorkspacePlanProductId: ({ workspacePlan }) => {
          return workspacePlan === workspacePlanName
            ? productId
            : cryptoRandomString({ length: 10 })
        },
        reconcileSubscriptionData: async () => {
          expect.fail()
        }
      })
      await downscaleSubscription({ workspaceSubscription })
    })
    it('reconciles the subscription to the new seat values', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const proPriceId = cryptoRandomString({ length: 10 })
      const proProductId = cryptoRandomString({ length: 10 })
      const proQuantity = 10
      const proSubscriptionItemId = cryptoRandomString({ length: 10 })

      const subscriptionData = createTestSubscriptionData({
        products: [
          {
            priceId: proPriceId,
            productId: proProductId,
            quantity: proQuantity,
            subscriptionItemId: proSubscriptionItemId
          }
        ]
      })
      const testWorkspaceSubscription = createTestWorkspaceSubscription({
        subscriptionData,
        workspaceId
      })
      const workspacePlanName = 'pro'

      let reconciledSub: SubscriptionDataInput | undefined = undefined
      const downscaleSubscription = downscaleWorkspaceSubscriptionFactory({
        getWorkspacePlan: async () => ({
          name: workspacePlanName,
          workspaceId,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'valid'
        }),
        countSeatsByTypeInWorkspace: async () => {
          return 5
        },
        getWorkspacePlanProductId: () => {
          return proProductId
        },
        reconcileSubscriptionData: async ({ subscriptionData }) => {
          reconciledSub = subscriptionData
        }
      })
      const hasDownscaled = await downscaleSubscription({
        workspaceSubscription: testWorkspaceSubscription
      })

      expect(hasDownscaled).to.be.true
      expect(
        reconciledSub!.products.find((p) => p.productId === proProductId)?.quantity
      ).to.be.equal(5)
    })
  })

  describe('upgradeWorkspaceSubscriptionFactory creates a function, that', () => {
    it('throws WorkspacePlanNotFound if no plan can be found', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const userId = cryptoRandomString({ length: 10 })
      const upgradeWorkspaceSubscription = upgradeWorkspaceSubscriptionFactory({
        getWorkspacePlan: async () => null,
        getWorkspacePlanProductId: () => {
          expect.fail()
        },
        getWorkspacePlanPriceId: () => {
          expect.fail()
        },
        getWorkspaceSubscription: () => {
          expect.fail()
        },
        reconcileSubscriptionData: () => {
          expect.fail()
        },
        updateWorkspaceSubscription: () => {
          expect.fail()
        },
        countSeatsByTypeInWorkspace: () => {
          expect.fail()
        }
      })
      const err = await expectToThrow(async () => {
        await upgradeWorkspaceSubscription({
          userId,
          workspaceId,
          targetPlan: 'team',
          billingInterval: 'monthly'
        })
      })

      expect(err.message).to.equal(new WorkspacePlanNotFoundError().message)
    })
    ;(['unlimited', 'academia'] as const).forEach((plan) => {
      it(`throws WorkspaceNotPaidPlan for ${plan}`, async () => {
        const workspaceId = cryptoRandomString({ length: 10 })
        const userId = cryptoRandomString({ length: 10 })
        const upgradeWorkspaceSubscription = upgradeWorkspaceSubscriptionFactory({
          getWorkspacePlan: async () => ({
            createdAt: new Date(),
            updatedAt: new Date(),
            name: plan,
            status: 'valid',
            workspaceId
          }),
          getWorkspacePlanProductId: () => {
            expect.fail()
          },
          getWorkspacePlanPriceId: () => {
            expect.fail()
          },
          getWorkspaceSubscription: () => {
            expect.fail()
          },
          reconcileSubscriptionData: () => {
            expect.fail()
          },
          updateWorkspaceSubscription: () => {
            expect.fail()
          },
          countSeatsByTypeInWorkspace: () => {
            expect.fail()
          }
        })
        const err = await expectToThrow(async () => {
          await upgradeWorkspaceSubscription({
            userId,
            workspaceId,
            targetPlan: 'team',
            billingInterval: 'monthly'
          })
        })

        expect(err.message).to.equal(new WorkspaceNotPaidPlanError().message)
      })
    })
    ;(['team', 'pro'] as const).forEach((plan) => {
      ;(['canceled', 'cancelationScheduled', 'paymentFailed'] as const).forEach(
        (status) => {
          it(`throws WorkspaceNotPaidPlan for ${plan} on a non valid status: ${status}`, async () => {
            const workspaceId = cryptoRandomString({ length: 10 })
            const userId = cryptoRandomString({ length: 10 })
            const upgradeWorkspaceSubscription = upgradeWorkspaceSubscriptionFactory({
              getWorkspacePlan: async () => ({
                workspaceId,
                createdAt: new Date(),
                updatedAt: new Date(),
                name: plan,
                status
              }),
              getWorkspacePlanProductId: () => {
                expect.fail()
              },
              getWorkspacePlanPriceId: () => {
                expect.fail()
              },
              getWorkspaceSubscription: () => {
                expect.fail()
              },
              reconcileSubscriptionData: () => {
                expect.fail()
              },
              updateWorkspaceSubscription: () => {
                expect.fail()
              },
              countSeatsByTypeInWorkspace: () => {
                expect.fail()
              }
            })
            const err = await expectToThrow(async () => {
              await upgradeWorkspaceSubscription({
                userId,
                workspaceId,
                targetPlan: 'pro',
                billingInterval: 'monthly'
              })
            })

            expect(err.message).to.equal(new WorkspaceNotPaidPlanError().message)
          })
        }
      )
    })
    it('throws WorkspaceSubscriptionNotFound', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const userId = cryptoRandomString({ length: 10 })
      const upgradeWorkspaceSubscription = upgradeWorkspaceSubscriptionFactory({
        getWorkspacePlan: async () => ({
          workspaceId,
          createdAt: new Date(),
          updatedAt: new Date(),
          name: 'team',
          status: 'valid'
        }),
        getWorkspacePlanProductId: () => {
          expect.fail()
        },
        getWorkspacePlanPriceId: () => {
          expect.fail()
        },
        getWorkspaceSubscription: async () => {
          return null
        },
        reconcileSubscriptionData: () => {
          expect.fail()
        },
        updateWorkspaceSubscription: () => {
          expect.fail()
        },
        countSeatsByTypeInWorkspace: () => {
          expect.fail()
        }
      })
      const err = await expectToThrow(async () => {
        await upgradeWorkspaceSubscription({
          userId,
          workspaceId,
          targetPlan: 'team',
          billingInterval: 'monthly'
        })
      })

      expect(err.message).to.equal(new WorkspaceSubscriptionNotFoundError().message)
    })

    it('throws WorkspacePlanUpgradeError for downgrading the plan', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const userId = cryptoRandomString({ length: 10 })
      const workspaceSubscription = createTestWorkspaceSubscription()
      const upgradeWorkspaceSubscription = upgradeWorkspaceSubscriptionFactory({
        getWorkspacePlan: async () => ({
          workspaceId,
          createdAt: new Date(),
          updatedAt: new Date(),
          name: 'pro',
          status: 'valid'
        }),
        getWorkspacePlanProductId: () => {
          expect.fail()
        },
        getWorkspacePlanPriceId: () => {
          expect.fail()
        },
        getWorkspaceSubscription: async () => {
          return workspaceSubscription
        },
        reconcileSubscriptionData: () => {
          expect.fail()
        },
        updateWorkspaceSubscription: () => {
          expect.fail()
        },
        countSeatsByTypeInWorkspace: () => {
          expect.fail()
        }
      })
      const err = await expectToThrow(async () => {
        await upgradeWorkspaceSubscription({
          userId,
          workspaceId,
          targetPlan: 'team',
          billingInterval: 'yearly'
        })
      })

      expect(err.message).to.equal("Can't upgrade to a less expensive plan")
    })

    it('throws WorkspacePlanUpgradeError for downgrading the billing interval', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const userId = cryptoRandomString({ length: 10 })
      const workspaceSubscription = createTestWorkspaceSubscription({
        billingInterval: 'yearly'
      })
      const upgradeWorkspaceSubscription = upgradeWorkspaceSubscriptionFactory({
        getWorkspacePlan: async () => ({
          workspaceId,
          createdAt: new Date(),
          updatedAt: new Date(),
          name: 'team',
          status: 'valid'
        }),
        getWorkspacePlanProductId: () => {
          expect.fail()
        },
        getWorkspacePlanPriceId: () => {
          expect.fail()
        },
        getWorkspaceSubscription: async () => {
          return workspaceSubscription
        },
        reconcileSubscriptionData: () => {
          expect.fail()
        },
        updateWorkspaceSubscription: () => {
          expect.fail()
        },
        countSeatsByTypeInWorkspace: () => {
          expect.fail()
        }
      })
      const err = await expectToThrow(async () => {
        await upgradeWorkspaceSubscription({
          userId,
          workspaceId,
          targetPlan: 'team',
          billingInterval: 'monthly'
        })
      })

      expect(err.message).to.equal("Can't upgrade from yearly to monthly billing cycle")
    })
    it('throws WorkspacePlanDowngradeError for noop requests', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const userId = cryptoRandomString({ length: 10 })
      const workspaceSubscription = createTestWorkspaceSubscription({
        billingInterval: 'monthly'
      })
      const upgradeWorkspaceSubscription = upgradeWorkspaceSubscriptionFactory({
        getWorkspacePlan: async () => ({
          workspaceId,
          createdAt: new Date(),
          updatedAt: new Date(),
          name: 'team',
          status: 'valid'
        }),
        getWorkspacePlanProductId: () => {
          expect.fail()
        },
        getWorkspacePlanPriceId: () => {
          expect.fail()
        },
        getWorkspaceSubscription: async () => {
          return workspaceSubscription
        },
        reconcileSubscriptionData: () => {
          expect.fail()
        },
        updateWorkspaceSubscription: () => {
          expect.fail()
        },
        countSeatsByTypeInWorkspace: () => {
          expect.fail()
        }
      })
      const err = await expectToThrow(async () => {
        await upgradeWorkspaceSubscription({
          userId,
          workspaceId,
          targetPlan: 'team',
          billingInterval: 'monthly'
        })
      })

      expect(err.message).to.equal("Can't upgrade to the same plan")
    })
    it('throws WorkspacePlanMismatchError if subscription has no seats for the current plan', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const userId = cryptoRandomString({ length: 10 })
      const subscriptionData: SubscriptionData = {
        cancelAt: null,
        customerId: cryptoRandomString({ length: 10 }),
        subscriptionId: cryptoRandomString({ length: 10 }),
        status: 'active',
        products: [],
        currentPeriodEnd: new Date()
      }
      const workspaceSubscription = createTestWorkspaceSubscription({
        subscriptionData
      })
      const upgradeWorkspaceSubscription = upgradeWorkspaceSubscriptionFactory({
        getWorkspacePlan: async () => ({
          workspaceId,
          createdAt: new Date(),
          updatedAt: new Date(),
          name: 'team',
          status: 'valid'
        }),
        getWorkspacePlanProductId: () => {
          return cryptoRandomString({ length: 10 })
        },
        getWorkspacePlanPriceId: () => {
          expect.fail()
        },
        getWorkspaceSubscription: async () => {
          return workspaceSubscription
        },
        reconcileSubscriptionData: () => {
          expect.fail()
        },
        updateWorkspaceSubscription: () => {
          expect.fail()
        },
        countSeatsByTypeInWorkspace: () => {
          expect.fail()
        }
      })
      const err = await expectToThrow(async () => {
        await upgradeWorkspaceSubscription({
          userId,
          workspaceId,
          targetPlan: 'pro',
          billingInterval: 'monthly'
        })
      })

      expect(err.message).to.equal(new WorkspacePlanMismatchError().message)
    })
    it('replaces current products with new product', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const userId = cryptoRandomString({ length: 10 })
      const subscriptionData: SubscriptionData = {
        cancelAt: null,
        customerId: cryptoRandomString({ length: 10 }),
        subscriptionId: cryptoRandomString({ length: 10 }),
        status: 'active',
        products: [
          {
            priceId: cryptoRandomString({ length: 10 }),
            productId: 'teamProduct',
            quantity: 10,
            subscriptionItemId: cryptoRandomString({ length: 10 })
          }
        ],
        currentPeriodEnd: new Date()
      }
      const workspaceSubscription = createTestWorkspaceSubscription({
        subscriptionData,
        billingInterval: 'monthly'
      })

      let reconciledSubscriptionData: SubscriptionDataInput | undefined = undefined
      let updatedWorkspaceSubscription: WorkspaceSubscription | undefined = undefined
      const upgradeWorkspaceSubscription = upgradeWorkspaceSubscriptionFactory({
        getWorkspacePlan: async () => ({
          workspaceId,
          createdAt: new Date(),
          updatedAt: new Date(),
          name: 'team',
          status: 'valid'
        }),
        getWorkspacePlanProductId: ({ workspacePlan }) => {
          switch (workspacePlan) {
            case 'team':
              return 'teamProduct'
            case 'teamUnlimited':
              return 'teamUnlimitedProduct'
            case 'pro':
              return 'proProduct'
            case 'proUnlimited':
              return 'proUnlimitedProduct'
          }
        },
        getWorkspacePlanPriceId: () => {
          return 'newPlanPrice'
        },
        getWorkspaceSubscription: async () => {
          return workspaceSubscription
        },
        reconcileSubscriptionData: async ({ subscriptionData }) => {
          reconciledSubscriptionData = subscriptionData
        },
        updateWorkspaceSubscription: async ({ workspaceSubscription }) => {
          updatedWorkspaceSubscription = workspaceSubscription
        },
        countSeatsByTypeInWorkspace: async () => {
          return 4
        }
      })
      await upgradeWorkspaceSubscription({
        userId,
        workspaceId,
        targetPlan: 'pro',
        billingInterval: 'yearly'
      })

      const updateIntent = updatedWorkspaceSubscription!
        .updateIntent as SubscriptionUpdateIntent
      expect(updateIntent).to.deep.contain({
        billingInterval: 'yearly',
        planName: 'pro',
        products: [
          {
            productId: 'proProduct',
            priceId: 'newPlanPrice',
            quantity: 4
          }
        ]
      })
      expect(reconciledSubscriptionData!.products.length).to.equal(1)
      expect(
        reconciledSubscriptionData!.products.find((p) => p.productId === 'proProduct')!
          .quantity
      ).to.equal(4)
    })
  })
  describe('getTotalSeatsCountByPlanFactory returns a function that, ', () => {
    it('should return 0 if subscription data has no product', () => {
      const getWorkspacePlanProductId = () => 'any'
      expect(
        getTotalSeatsCountByPlanFactory({ getWorkspacePlanProductId })({
          workspacePlan: 'pro',
          subscriptionData: { products: [] }
        })
      ).to.eq(0)
    })
    it('should return the number of purchased seats in the current billing period for the subscription', () => {
      const getWorkspacePlanProductId = () => 'productId'
      expect(
        getTotalSeatsCountByPlanFactory({ getWorkspacePlanProductId })({
          workspacePlan: 'pro',
          subscriptionData: {
            products: [
              {
                productId: 'productId',
                quantity: 4
              } as SubscriptionData['products'][number]
            ]
          }
        })
      ).to.eq(4)
    })
  })
})
