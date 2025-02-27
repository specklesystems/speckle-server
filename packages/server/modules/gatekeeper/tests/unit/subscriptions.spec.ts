import { logger } from '@/logging/logging'
import {
  SubscriptionData,
  SubscriptionDataInput,
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
  downscaleWorkspaceSubscriptionFactory,
  handleSubscriptionUpdateFactory,
  manageSubscriptionDownscaleFactory,
  upgradeWorkspaceSubscriptionFactory
} from '@/modules/gatekeeper/services/subscriptions'
import {
  createTestSubscriptionData,
  createTestWorkspaceSubscription
} from '@/modules/gatekeeper/tests/helpers'
import { WorkspacePlan } from '@/modules/gatekeeperCore/domain/billing'
import { NotImplementedError } from '@/modules/shared/errors'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { expectToThrow, itEach } from '@/test/assertionHelper'
import { PaidWorkspacePlans, throwUncoveredError } from '@speckle/shared'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'
import { omit } from 'lodash'

const { FF_WORKSPACES_NEW_PLANS_ENABLED } = getFeatureFlags()

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
          getWorkspaceSubscriptionBySubscriptionId: async () =>
            createTestWorkspaceSubscription({ subscriptionData }),
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
            getWorkspaceSubscriptionBySubscriptionId: async () =>
              createTestWorkspaceSubscription({
                subscriptionData,
                workspaceId
              }),
            getWorkspacePlan: async () => ({
              name,
              workspaceId,
              createdAt: new Date(),
              status: 'valid'
            }),
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
      const workspaceSubscription = createTestWorkspaceSubscription({
        subscriptionData,
        workspaceId
      })

      let updatedSubscription: WorkspaceSubscription | undefined = undefined
      let updatedPlan: WorkspacePlan | undefined = undefined

      await handleSubscriptionUpdateFactory({
        getWorkspaceSubscriptionBySubscriptionId: async () => workspaceSubscription,
        getWorkspacePlan: async () => ({
          name: 'starter',
          workspaceId,
          createdAt: new Date(),
          status: 'trial'
        }),
        upsertWorkspaceSubscription: async ({ workspaceSubscription }) => {
          updatedSubscription = workspaceSubscription
        },
        upsertPaidWorkspacePlan: async ({ workspacePlan }) => {
          updatedPlan = workspacePlan
        }
      })({ subscriptionData })
      expect(updatedPlan!.status).to.be.equal('cancelationScheduled')
      expect(updatedSubscription!.updatedAt).to.be.greaterThanOrEqual(
        workspaceSubscription.updatedAt
      )
      expect(omit(updatedSubscription!, 'updatedAt')).deep.equal(
        omit(workspaceSubscription, 'updatedAt')
      )
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
        getWorkspacePlan: async () => ({
          name: 'starter',
          workspaceId,
          createdAt: new Date(),
          status: 'trial'
        }),
        upsertWorkspaceSubscription: async ({ workspaceSubscription }) => {
          updatedSubscription = workspaceSubscription
        },
        upsertPaidWorkspacePlan: async ({ workspacePlan }) => {
          updatedPlan = workspacePlan
        }
      })({ subscriptionData })
      expect(updatedPlan!.status).to.be.equal('valid')
      expect(updatedSubscription!.updatedAt).to.be.greaterThanOrEqual(
        workspaceSubscription.updatedAt
      )
      expect(omit(updatedSubscription!, 'updatedAt')).deep.equal(
        omit(workspaceSubscription, 'updatedAt')
      )
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

      await handleSubscriptionUpdateFactory({
        getWorkspaceSubscriptionBySubscriptionId: async () => workspaceSubscription,
        getWorkspacePlan: async () => ({
          name: 'starter',
          workspaceId,
          createdAt: new Date(),
          status: 'trial'
        }),
        upsertWorkspaceSubscription: async ({ workspaceSubscription }) => {
          updatedSubscription = workspaceSubscription
        },
        upsertPaidWorkspacePlan: async ({ workspacePlan }) => {
          updatedPlan = workspacePlan
        }
      })({ subscriptionData })
      expect(updatedPlan!.status).to.be.equal('paymentFailed')
      expect(updatedSubscription!.updatedAt).to.be.greaterThanOrEqual(
        workspaceSubscription.updatedAt
      )
      expect(omit(updatedSubscription!, 'updatedAt')).deep.equal(
        omit(workspaceSubscription, 'updatedAt')
      )
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
        getWorkspacePlan: async () => ({
          name: 'starter',
          workspaceId,
          createdAt: new Date(),
          status: 'trial'
        }),
        upsertWorkspaceSubscription: async ({ workspaceSubscription }) => {
          updatedSubscription = workspaceSubscription
        },
        upsertPaidWorkspacePlan: async ({ workspacePlan }) => {
          updatedPlan = workspacePlan
        }
      })({ subscriptionData })
      expect(updatedPlan!.status).to.be.equal('canceled')
      expect(updatedSubscription!.updatedAt).to.be.greaterThanOrEqual(
        workspaceSubscription.updatedAt
      )
      expect(omit(updatedSubscription!, 'updatedAt')).deep.equal(
        omit(workspaceSubscription, 'updatedAt')
      )
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
            name: 'starter',
            workspaceId,
            createdAt: new Date(),
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
  describe('addWorkspaceSubscriptionSeatIfNeededFactory returns a function, that', () => {
    it('just returns if the workspacePlan is not found', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const addWorkspaceSubscriptionSeatIfNeeded =
        addWorkspaceSubscriptionSeatIfNeededFactory({
          getWorkspacePlan: async () => null,
          getWorkspaceSubscription: async () => {
            expect.fail()
          },
          countWorkspaceRole: async () => {
            expect.fail()
          },
          getWorkspacePlanPrice: () => {
            expect.fail()
          },
          getWorkspacePlanProductId: () => {
            expect.fail()
          },
          reconcileSubscriptionData: async () => {
            expect.fail()
          }
        })
      await addWorkspaceSubscriptionSeatIfNeeded({
        workspaceId,
        role: 'workspace:admin'
      })
      expect(true).to.be.true
    })
    it('returns if the workspaceSubscription is not found', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const addWorkspaceSubscriptionSeatIfNeeded =
        addWorkspaceSubscriptionSeatIfNeededFactory({
          getWorkspacePlan: async () => ({
            name: 'unlimited',
            workspaceId,
            createdAt: new Date(),
            status: 'valid'
          }),
          getWorkspaceSubscription: async () => null,
          countWorkspaceRole: async () => {
            expect.fail()
          },
          getWorkspacePlanPrice: () => {
            expect.fail()
          },
          getWorkspacePlanProductId: () => {
            expect.fail()
          },
          reconcileSubscriptionData: async () => {
            expect.fail()
          }
        })
      await addWorkspaceSubscriptionSeatIfNeeded({
        workspaceId,
        role: 'workspace:admin'
      })
    })
    it('throws if a non paid plan, has a subscription', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const subscriptionData = createTestSubscriptionData({ products: [] })
      const workspaceSubscription = createTestWorkspaceSubscription({
        workspaceId,
        subscriptionData
      })
      const addWorkspaceSubscriptionSeatIfNeeded =
        addWorkspaceSubscriptionSeatIfNeededFactory({
          getWorkspacePlan: async () => ({
            name: 'unlimited',
            workspaceId,
            createdAt: new Date(),
            status: 'valid'
          }),
          getWorkspaceSubscription: async () => workspaceSubscription,
          countWorkspaceRole: async () => {
            expect.fail()
          },
          getWorkspacePlanPrice: () => {
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
        await addWorkspaceSubscriptionSeatIfNeeded({
          workspaceId,
          role: 'workspace:admin'
        })
      })
      expect(err.message).to.equal(new WorkspacePlanMismatchError().message)
    })
    it('returns without reconciliation if the subscription is canceled', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const subscriptionData = createTestSubscriptionData({ products: [] })
      const workspaceSubscription = createTestWorkspaceSubscription({
        workspaceId,
        subscriptionData
      })
      const addWorkspaceSubscriptionSeatIfNeeded =
        addWorkspaceSubscriptionSeatIfNeededFactory({
          getWorkspacePlan: async () => ({
            name: 'plus',
            workspaceId,
            createdAt: new Date(),
            status: 'canceled'
          }),
          getWorkspaceSubscription: async () => workspaceSubscription,
          countWorkspaceRole: async () => {
            expect.fail()
          },
          getWorkspacePlanPrice: () => {
            expect.fail()
          },
          getWorkspacePlanProductId: () => {
            expect.fail()
          },
          reconcileSubscriptionData: async () => {
            expect.fail()
          }
        })
      await addWorkspaceSubscriptionSeatIfNeeded({
        workspaceId,
        role: 'workspace:admin'
      })
    })
    it('uses the guest count, guest product and price id if the new role is workspace:guest', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const subscriptionData = createTestSubscriptionData({ products: [] })
      const workspaceSubscription = createTestWorkspaceSubscription({
        workspaceId,
        subscriptionData
      })
      const workspacePlan: WorkspacePlan = {
        name: 'starter',
        workspaceId,
        createdAt: new Date(),
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
          countWorkspaceRole: async ({ workspaceRole }) => {
            switch (workspaceRole) {
              case 'workspace:admin':
              case 'workspace:member':
                expect.fail()
              case 'workspace:guest':
                return roleCount
            }
          },
          getWorkspacePlanPrice: ({ workspacePlan, billingInterval }) => {
            if (billingInterval !== workspaceSubscription.billingInterval) expect.fail()
            switch (workspacePlan) {
              case 'business':
              case 'starter':
              case 'plus':
              case 'team':
              case 'pro':
                expect.fail()
              case 'guest':
                return priceId
              default:
                throwUncoveredError(workspacePlan)
            }
          },
          getWorkspacePlanProductId: (args) => {
            if (args.workspacePlan !== 'guest') expect.fail()
            return productId
          },
          reconcileSubscriptionData: async ({ applyProrotation, subscriptionData }) => {
            if (!applyProrotation) expect.fail()
            reconciledSubscriptionData = subscriptionData
          }
        })
      await addWorkspaceSubscriptionSeatIfNeeded({
        workspaceId,
        role: 'workspace:guest'
      })
      expect(reconciledSubscriptionData!.products).deep.equalInAnyOrder([
        { productId, priceId, quantity: roleCount }
      ])
    })
    ;(['workspace:member', 'workspace:admin'] as const).forEach((role) =>
      it(`uses the admin + member count, workspacePlan product and price id if the new role is ${role}`, async () => {
        const workspaceId = cryptoRandomString({ length: 10 })
        const subscriptionData = createTestSubscriptionData({ products: [] })
        const workspaceSubscription = createTestWorkspaceSubscription({
          workspaceId,
          subscriptionData
        })
        const workspacePlan: WorkspacePlan = {
          name: 'starter',
          workspaceId,
          createdAt: new Date(),
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
            countWorkspaceRole: async ({ workspaceRole }) => {
              switch (workspaceRole) {
                case 'workspace:admin':
                case 'workspace:member':
                  return roleCount
                case 'workspace:guest':
                  expect.fail()
              }
            },
            getWorkspacePlanPrice: ({ workspacePlan, billingInterval }) => {
              if (billingInterval !== workspaceSubscription.billingInterval)
                expect.fail()
              switch (workspacePlan) {
                case 'business':
                case 'plus':
                case 'guest':
                case 'team':
                case 'pro':
                  expect.fail()
                case 'starter':
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
              applyProrotation,
              subscriptionData
            }) => {
              if (!applyProrotation) expect.fail()
              reconciledSubscriptionData = subscriptionData
            }
          })
        await addWorkspaceSubscriptionSeatIfNeeded({
          workspaceId,
          role
        })
        expect(reconciledSubscriptionData!.products).deep.equalInAnyOrder([
          { productId, priceId, quantity: 2 * roleCount }
        ])
      })
    )
    it('updates the sub existing product quantity if the one matching the new role, does not have enough quantities', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })

      const priceId = cryptoRandomString({ length: 10 })
      const productId = cryptoRandomString({ length: 10 })
      const subscriptionItemId = cryptoRandomString({ length: 10 })
      const subscriptionData = createTestSubscriptionData({
        products: [
          {
            priceId,
            productId,
            quantity: 4,
            subscriptionItemId
          }
        ]
      })
      const workspaceSubscription = createTestWorkspaceSubscription({
        workspaceId,
        subscriptionData
      })
      const workspacePlan: WorkspacePlan = {
        name: 'starter',
        workspaceId,
        createdAt: new Date(),
        status: 'valid'
      }
      const roleCount = 10

      let reconciledSubscriptionData: SubscriptionDataInput | undefined = undefined
      const addWorkspaceSubscriptionSeatIfNeeded =
        addWorkspaceSubscriptionSeatIfNeededFactory({
          getWorkspacePlan: async () => workspacePlan,
          getWorkspaceSubscription: async () => workspaceSubscription,
          countWorkspaceRole: async ({ workspaceRole }) => {
            switch (workspaceRole) {
              case 'workspace:admin':
              case 'workspace:member':
                return roleCount
              case 'workspace:guest':
                expect.fail()
            }
          },
          getWorkspacePlanPrice: ({ workspacePlan, billingInterval }) => {
            if (billingInterval !== workspaceSubscription.billingInterval) expect.fail()
            switch (workspacePlan) {
              case 'business':
              case 'plus':
              case 'guest':
              case 'team':
              case 'pro':
                expect.fail()
              case 'starter':
                return priceId
              default:
                throwUncoveredError(workspacePlan)
            }
          },
          getWorkspacePlanProductId: (args) => {
            if (args.workspacePlan !== workspacePlan.name) expect.fail()
            return productId
          },
          reconcileSubscriptionData: async ({ applyProrotation, subscriptionData }) => {
            if (!applyProrotation) expect.fail()
            reconciledSubscriptionData = subscriptionData
          }
        })
      await addWorkspaceSubscriptionSeatIfNeeded({
        workspaceId,
        role: 'workspace:member'
      })
      expect(reconciledSubscriptionData!.products).deep.equalInAnyOrder([
        { productId, priceId, quantity: 2 * roleCount, subscriptionItemId }
      ])
    })
    it('does not update the subscription if the product matching the new role, has enough quantities', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })

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
        name: 'starter',
        workspaceId,
        createdAt: new Date(),
        status: 'valid'
      }
      const roleCount = 1

      const addWorkspaceSubscriptionSeatIfNeeded =
        addWorkspaceSubscriptionSeatIfNeededFactory({
          getWorkspacePlan: async () => workspacePlan,
          getWorkspaceSubscription: async () => workspaceSubscription,
          countWorkspaceRole: async ({ workspaceRole }) => {
            switch (workspaceRole) {
              case 'workspace:admin':
              case 'workspace:member':
                return roleCount
              case 'workspace:guest':
                expect.fail()
            }
          },
          getWorkspacePlanPrice: ({ workspacePlan, billingInterval }) => {
            if (billingInterval !== workspaceSubscription.billingInterval) expect.fail()
            switch (workspacePlan) {
              case 'business':
              case 'plus':
              case 'guest':
              case 'team':
              case 'pro':
                expect.fail()
              case 'starter':
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
          }
        })
      await addWorkspaceSubscriptionSeatIfNeeded({
        workspaceId,
        role: 'workspace:member'
      })
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
        countWorkspaceRole: async () => {
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
          status: 'valid'
        }),
        countWorkspaceRole: async () => {
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
          name: 'plus',
          workspaceId,
          createdAt: new Date(),
          status: 'canceled'
        }),
        countWorkspaceRole: async () => {
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
      const workspacePlanName = 'plus'
      const downscaleSubscription = downscaleWorkspaceSubscriptionFactory({
        getWorkspacePlan: async () => ({
          name: workspacePlanName,
          workspaceId,
          createdAt: new Date(),
          status: 'valid'
        }),
        countWorkspaceRole: async ({ workspaceRole }) => {
          return workspaceRole === 'workspace:guest' ? 0 : 5 // 5+5 will be 10 as quantity
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

      const guestPriceId = cryptoRandomString({ length: 10 })
      const guestProductId = cryptoRandomString({ length: 10 })
      const guestQuantity = 10
      const guestSubscriptionItemId = cryptoRandomString({ length: 10 })
      const subscriptionData = createTestSubscriptionData({
        products: [
          {
            priceId: proPriceId,
            productId: proProductId,
            quantity: proQuantity,
            subscriptionItemId: proSubscriptionItemId
          },
          {
            priceId: guestPriceId,
            productId: guestProductId,
            quantity: guestQuantity,
            subscriptionItemId: guestSubscriptionItemId
          }
        ]
      })
      const testWorkspaceSubscription = createTestWorkspaceSubscription({
        subscriptionData,
        workspaceId
      })
      const workspacePlanName = 'plus'

      let reconciledSub: SubscriptionDataInput | undefined = undefined
      const downscaleSubscription = downscaleWorkspaceSubscriptionFactory({
        getWorkspacePlan: async () => ({
          name: workspacePlanName,
          workspaceId,
          createdAt: new Date(),
          status: 'valid'
        }),
        countWorkspaceRole: async ({ workspaceRole }) => {
          return workspaceRole === 'workspace:guest'
            ? guestQuantity / 2
            : proQuantity / 2 //we're halving the guest seats, regulars stay the same
        },
        getWorkspacePlanProductId: ({ workspacePlan }) => {
          return workspacePlan === workspacePlanName ? proProductId : guestProductId
        },
        reconcileSubscriptionData: async ({ subscriptionData }) => {
          reconciledSub = subscriptionData
        }
      })
      await downscaleSubscription({ workspaceSubscription: testWorkspaceSubscription })

      expect(
        reconciledSub!.products.find((p) => p.productId === proProductId)?.quantity
      ).to.be.equal(proQuantity)
      expect(
        reconciledSub!.products.find((p) => p.productId === guestProductId)?.quantity
      ).to.be.equal(guestQuantity / 2)
    })
  })
  describe('manageSubscriptionDownscaleFactory, creates a function, that', () => {
    it('still updates the monthly billing cycle end, even if subscription reconciliation fails', async () => {
      const testWorkspaceSubscription = createTestWorkspaceSubscription({
        billingInterval: 'monthly',
        currentBillingCycleEnd: new Date(2034, 11, 5)
      })
      let updatedWorkspaceSubscription: WorkspaceSubscription | undefined = undefined
      await manageSubscriptionDownscaleFactory({
        logger,
        getWorkspaceSubscriptions: async () => [testWorkspaceSubscription],
        downscaleWorkspaceSubscription: async () => {
          throw new Error('kabumm')
        },
        updateWorkspaceSubscription: async ({ workspaceSubscription }) => {
          updatedWorkspaceSubscription = workspaceSubscription
        }
      })()

      const updatedBillingCycleEnd = new Date(2035, 0, 5)
      expect(updatedWorkspaceSubscription).deep.equal({
        ...testWorkspaceSubscription,
        currentBillingCycleEnd: updatedBillingCycleEnd
      })
    })
    it('still updates the yearly billing cycle end, even if subscription reconciliation fails', async () => {
      const testWorkspaceSubscription = createTestWorkspaceSubscription({
        billingInterval: 'yearly',
        currentBillingCycleEnd: new Date(2034, 11, 5)
      })
      let updatedWorkspaceSubscription: WorkspaceSubscription | undefined = undefined
      await manageSubscriptionDownscaleFactory({
        logger,
        getWorkspaceSubscriptions: async () => [testWorkspaceSubscription],
        downscaleWorkspaceSubscription: async () => {
          throw new Error('kabumm')
        },
        updateWorkspaceSubscription: async ({ workspaceSubscription }) => {
          updatedWorkspaceSubscription = workspaceSubscription
        }
      })()

      const updatedBillingCycleEnd = new Date(2035, 11, 5)
      expect(updatedWorkspaceSubscription).deep.equal({
        ...testWorkspaceSubscription,
        currentBillingCycleEnd: updatedBillingCycleEnd
      })
    })
  })
  describe('upgradeWorkspaceSubscriptionFactory creates a function, that', () => {
    it('throws WorkspacePlanNotFound if no plan can be found', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const upgradeWorkspaceSubscription = upgradeWorkspaceSubscriptionFactory({
        getWorkspacePlan: async () => null,
        getWorkspacePlanProductId: () => {
          expect.fail()
        },
        getWorkspacePlanPrice: () => {
          expect.fail()
        },
        getWorkspaceSubscription: () => {
          expect.fail()
        },
        reconcileSubscriptionData: () => {
          expect.fail()
        },
        upsertWorkspacePlan: () => {
          expect.fail()
        },
        updateWorkspaceSubscription: () => {
          expect.fail()
        },
        countWorkspaceRole: () => {
          expect.fail()
        }
      })
      const err = await expectToThrow(async () => {
        await upgradeWorkspaceSubscription({
          workspaceId,
          targetPlan: 'business',
          billingInterval: 'monthly'
        })
      })

      expect(err.message).to.equal(new WorkspacePlanNotFoundError().message)
    })
    ;(['unlimited', 'academia'] as const).forEach((plan) => {
      it(`throws WorkspaceNotPaidPlan for ${plan}`, async () => {
        const workspaceId = cryptoRandomString({ length: 10 })
        const upgradeWorkspaceSubscription = upgradeWorkspaceSubscriptionFactory({
          getWorkspacePlan: async () => ({
            createdAt: new Date(),
            name: plan,
            status: 'valid',
            workspaceId
          }),
          getWorkspacePlanProductId: () => {
            expect.fail()
          },
          getWorkspacePlanPrice: () => {
            expect.fail()
          },
          getWorkspaceSubscription: () => {
            expect.fail()
          },
          reconcileSubscriptionData: () => {
            expect.fail()
          },
          upsertWorkspacePlan: () => {
            expect.fail()
          },
          updateWorkspaceSubscription: () => {
            expect.fail()
          },
          countWorkspaceRole: () => {
            expect.fail()
          }
        })
        const err = await expectToThrow(async () => {
          await upgradeWorkspaceSubscription({
            workspaceId,
            targetPlan: 'business',
            billingInterval: 'monthly'
          })
        })

        expect(err.message).to.equal(new WorkspaceNotPaidPlanError().message)
      })
    })
    ;(['starter', 'plus', 'business'] as const).forEach((plan) => {
      ;(['canceled', 'cancelationScheduled', 'paymentFailed'] as const).forEach(
        (status) => {
          it(`throws WorkspaceNotPaidPlan for ${plan} on a non valid status: ${status}`, async () => {
            const workspaceId = cryptoRandomString({ length: 10 })
            const upgradeWorkspaceSubscription = upgradeWorkspaceSubscriptionFactory({
              getWorkspacePlan: async () => ({
                workspaceId,
                createdAt: new Date(),
                name: plan,
                status
              }),
              getWorkspacePlanProductId: () => {
                expect.fail()
              },
              getWorkspacePlanPrice: () => {
                expect.fail()
              },
              getWorkspaceSubscription: () => {
                expect.fail()
              },
              reconcileSubscriptionData: () => {
                expect.fail()
              },
              upsertWorkspacePlan: () => {
                expect.fail()
              },
              updateWorkspaceSubscription: () => {
                expect.fail()
              },
              countWorkspaceRole: () => {
                expect.fail()
              }
            })
            const err = await expectToThrow(async () => {
              await upgradeWorkspaceSubscription({
                workspaceId,
                targetPlan: 'business',
                billingInterval: 'monthly'
              })
            })

            expect(err.message).to.equal(new WorkspaceNotPaidPlanError().message)
          })
        }
      )
    })
    ;(['starter'] as const).forEach((plan) => {
      ;(['trial', 'expired'] as const).forEach((status) => {
        it(`throws WorkspaceNotPaidPlan for ${plan} on a trial status: ${status}`, async () => {
          const workspaceId = cryptoRandomString({ length: 10 })
          const upgradeWorkspaceSubscription = upgradeWorkspaceSubscriptionFactory({
            getWorkspacePlan: async () => ({
              workspaceId,
              createdAt: new Date(),
              name: plan,
              status
            }),
            getWorkspacePlanProductId: () => {
              expect.fail()
            },
            getWorkspacePlanPrice: () => {
              expect.fail()
            },
            getWorkspaceSubscription: () => {
              expect.fail()
            },
            reconcileSubscriptionData: () => {
              expect.fail()
            },
            upsertWorkspacePlan: () => {
              expect.fail()
            },
            updateWorkspaceSubscription: () => {
              expect.fail()
            },
            countWorkspaceRole: () => {
              expect.fail()
            }
          })
          const err = await expectToThrow(async () => {
            await upgradeWorkspaceSubscription({
              workspaceId,
              targetPlan: 'business',
              billingInterval: 'monthly'
            })
          })

          expect(err.message).to.equal(new WorkspaceNotPaidPlanError().message)
        })
      })
    })
    it('throws WorkspaceSubscriptionNotFound', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const upgradeWorkspaceSubscription = upgradeWorkspaceSubscriptionFactory({
        getWorkspacePlan: async () => ({
          workspaceId,
          createdAt: new Date(),
          name: 'business',
          status: 'valid'
        }),
        getWorkspacePlanProductId: () => {
          expect.fail()
        },
        getWorkspacePlanPrice: () => {
          expect.fail()
        },
        getWorkspaceSubscription: async () => {
          return null
        },
        reconcileSubscriptionData: () => {
          expect.fail()
        },
        upsertWorkspacePlan: () => {
          expect.fail()
        },
        updateWorkspaceSubscription: () => {
          expect.fail()
        },
        countWorkspaceRole: () => {
          expect.fail()
        }
      })
      const err = await expectToThrow(async () => {
        await upgradeWorkspaceSubscription({
          workspaceId,
          targetPlan: 'business',
          billingInterval: 'monthly'
        })
      })

      expect(err.message).to.equal(new WorkspaceSubscriptionNotFoundError().message)
    })

    itEach(
      <
        Array<{
          oldPlan: PaidWorkspacePlans
          newPlan: PaidWorkspacePlans
        }>
      >[
        { oldPlan: 'starter', newPlan: 'team' },
        { oldPlan: 'team', newPlan: 'starter' }
      ],
      ({ oldPlan, newPlan }) =>
        `throws WorkspacePlanUpgradeError for switching between incompatible plan types: ${oldPlan} -> ${newPlan}`,
      async ({ oldPlan, newPlan }) => {
        const workspaceId = cryptoRandomString({ length: 10 })
        const workspaceSubscription = createTestWorkspaceSubscription()
        const upgradeWorkspaceSubscription = upgradeWorkspaceSubscriptionFactory({
          getWorkspacePlan: async () => ({
            workspaceId,
            createdAt: new Date(),
            name: oldPlan,
            status: 'valid'
          }),
          getWorkspacePlanProductId: () => {
            expect.fail()
          },
          getWorkspacePlanPrice: () => {
            expect.fail()
          },
          getWorkspaceSubscription: async () => {
            return workspaceSubscription
          },
          reconcileSubscriptionData: () => {
            expect.fail()
          },
          upsertWorkspacePlan: () => {
            expect.fail()
          },
          updateWorkspaceSubscription: () => {
            expect.fail()
          },
          countWorkspaceRole: () => {
            expect.fail()
          }
        })
        const err = await expectToThrow(async () => {
          await upgradeWorkspaceSubscription({
            workspaceId,
            targetPlan: newPlan,
            billingInterval: 'yearly'
          })
        })

        if (FF_WORKSPACES_NEW_PLANS_ENABLED) {
          expect(err.message).to.equal(
            'Attempting to switch between incompatible plan types'
          )
        } else {
          expect(err.message).to.equal(NotImplementedError.defaultMessage)
        }
      }
    )

    it('throws WorkspacePlanUpgradeError for downgrading the plan', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const workspaceSubscription = createTestWorkspaceSubscription()
      const upgradeWorkspaceSubscription = upgradeWorkspaceSubscriptionFactory({
        getWorkspacePlan: async () => ({
          workspaceId,
          createdAt: new Date(),
          name: 'business',
          status: 'valid'
        }),
        getWorkspacePlanProductId: () => {
          expect.fail()
        },
        getWorkspacePlanPrice: () => {
          expect.fail()
        },
        getWorkspaceSubscription: async () => {
          return workspaceSubscription
        },
        reconcileSubscriptionData: () => {
          expect.fail()
        },
        upsertWorkspacePlan: () => {
          expect.fail()
        },
        updateWorkspaceSubscription: () => {
          expect.fail()
        },
        countWorkspaceRole: () => {
          expect.fail()
        }
      })
      const err = await expectToThrow(async () => {
        await upgradeWorkspaceSubscription({
          workspaceId,
          targetPlan: 'starter',
          billingInterval: 'yearly'
        })
      })

      expect(err.message).to.equal("Can't upgrade to a less expensive plan")
    })

    it('throws WorkspacePlanUpgradeError for downgrading the billing interval', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const workspaceSubscription = createTestWorkspaceSubscription({
        billingInterval: 'yearly'
      })
      const upgradeWorkspaceSubscription = upgradeWorkspaceSubscriptionFactory({
        getWorkspacePlan: async () => ({
          workspaceId,
          createdAt: new Date(),
          name: 'business',
          status: 'valid'
        }),
        getWorkspacePlanProductId: () => {
          expect.fail()
        },
        getWorkspacePlanPrice: () => {
          expect.fail()
        },
        getWorkspaceSubscription: async () => {
          return workspaceSubscription
        },
        reconcileSubscriptionData: () => {
          expect.fail()
        },
        upsertWorkspacePlan: () => {
          expect.fail()
        },
        updateWorkspaceSubscription: () => {
          expect.fail()
        },
        countWorkspaceRole: () => {
          expect.fail()
        }
      })
      const err = await expectToThrow(async () => {
        await upgradeWorkspaceSubscription({
          workspaceId,
          targetPlan: 'business',
          billingInterval: 'monthly'
        })
      })

      expect(err.message).to.equal("Can't upgrade from yearly to monthly billing cycle")
    })
    it('throws WorkspacePlanDowngradeError for noop requests', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const workspaceSubscription = createTestWorkspaceSubscription({
        billingInterval: 'monthly'
      })
      const upgradeWorkspaceSubscription = upgradeWorkspaceSubscriptionFactory({
        getWorkspacePlan: async () => ({
          workspaceId,
          createdAt: new Date(),
          name: 'business',
          status: 'valid'
        }),
        getWorkspacePlanProductId: () => {
          expect.fail()
        },
        getWorkspacePlanPrice: () => {
          expect.fail()
        },
        getWorkspaceSubscription: async () => {
          return workspaceSubscription
        },
        reconcileSubscriptionData: () => {
          expect.fail()
        },
        upsertWorkspacePlan: () => {
          expect.fail()
        },
        updateWorkspaceSubscription: () => {
          expect.fail()
        },
        countWorkspaceRole: () => {
          expect.fail()
        }
      })
      const err = await expectToThrow(async () => {
        await upgradeWorkspaceSubscription({
          workspaceId,
          targetPlan: 'business',
          billingInterval: 'monthly'
        })
      })

      expect(err.message).to.equal("Can't upgrade to the same plan")
    })
    it('throws WorkspacePlanMismatchError if subscription has no seats for the current plan', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const subscriptionData: SubscriptionData = {
        cancelAt: null,
        customerId: cryptoRandomString({ length: 10 }),
        subscriptionId: cryptoRandomString({ length: 10 }),
        status: 'active',
        products: []
      }
      const workspaceSubscription = createTestWorkspaceSubscription({
        subscriptionData
      })
      const upgradeWorkspaceSubscription = upgradeWorkspaceSubscriptionFactory({
        getWorkspacePlan: async () => ({
          workspaceId,
          createdAt: new Date(),
          name: 'starter',
          status: 'valid'
        }),
        getWorkspacePlanProductId: () => {
          return cryptoRandomString({ length: 10 })
        },
        getWorkspacePlanPrice: () => {
          expect.fail()
        },
        getWorkspaceSubscription: async () => {
          return workspaceSubscription
        },
        reconcileSubscriptionData: () => {
          expect.fail()
        },
        upsertWorkspacePlan: () => {
          expect.fail()
        },
        updateWorkspaceSubscription: () => {
          expect.fail()
        },
        countWorkspaceRole: () => {
          expect.fail()
        }
      })
      const err = await expectToThrow(async () => {
        await upgradeWorkspaceSubscription({
          workspaceId,
          targetPlan: 'business',
          billingInterval: 'monthly'
        })
      })

      expect(err.message).to.equal(new WorkspacePlanMismatchError().message)
    })
    it('replaces current products with new product', async () => {
      const workspaceId = cryptoRandomString({ length: 10 })
      const subscriptionData: SubscriptionData = {
        cancelAt: null,
        customerId: cryptoRandomString({ length: 10 }),
        subscriptionId: cryptoRandomString({ length: 10 }),
        status: 'active',
        products: [
          {
            priceId: cryptoRandomString({ length: 10 }),
            productId: 'guestProduct',
            quantity: 10,
            subscriptionItemId: cryptoRandomString({ length: 10 })
          },
          {
            priceId: cryptoRandomString({ length: 10 }),
            productId: 'starterProduct',
            quantity: 20,
            subscriptionItemId: cryptoRandomString({ length: 10 })
          }
        ]
      }
      const workspaceSubscription = createTestWorkspaceSubscription({
        subscriptionData,
        billingInterval: 'monthly'
      })

      let reconciledSubscriptionData: SubscriptionDataInput | undefined = undefined
      let updatedWorkspacePlan: WorkspacePlan | undefined = undefined
      let updatedWorkspaceSubscription: WorkspaceSubscription | undefined = undefined
      const upgradeWorkspaceSubscription = upgradeWorkspaceSubscriptionFactory({
        getWorkspacePlan: async () => ({
          workspaceId,
          createdAt: new Date(),
          name: 'starter',
          status: 'valid'
        }),
        getWorkspacePlanProductId: ({ workspacePlan }) => {
          switch (workspacePlan) {
            case 'starter':
              return 'starterProduct'
            case 'plus':
              return 'plusProduct'
            case 'business':
              return 'businessProduct'
            case 'guest':
              return 'guestProduct'
            case 'team':
              return 'teamProduct'
            case 'pro':
              return 'proProduct'
          }
        },
        getWorkspacePlanPrice: () => {
          return 'newPlanPrice'
        },
        getWorkspaceSubscription: async () => {
          return workspaceSubscription
        },
        reconcileSubscriptionData: async ({ subscriptionData }) => {
          reconciledSubscriptionData = subscriptionData
        },
        upsertWorkspacePlan: async ({ workspacePlan }) => {
          updatedWorkspacePlan = workspacePlan
        },
        updateWorkspaceSubscription: async ({ workspaceSubscription }) => {
          updatedWorkspaceSubscription = workspaceSubscription
        },
        countWorkspaceRole: async () => {
          return 4
        }
      })
      await upgradeWorkspaceSubscription({
        workspaceId,
        targetPlan: 'business',
        billingInterval: 'yearly'
      })

      expect(updatedWorkspacePlan!.name).to.equal('business')

      expect(reconciledSubscriptionData!.products.length).to.equal(2)

      expect(updatedWorkspaceSubscription!.billingInterval === 'yearly')

      expect(
        reconciledSubscriptionData!.products.find(
          (p) => p.productId === 'guestProduct'
        )!.quantity
      ).to.equal(4)
      const newProduct = reconciledSubscriptionData!.products.find(
        (p) => p.productId === 'businessProduct'
      )

      expect(newProduct!.quantity).to.equal(8)
      expect(newProduct!.priceId).to.equal('newPlanPrice')
    })
  })
})
