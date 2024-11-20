import db from '@/db/knex'
import {
  deleteCheckoutSessionFactory,
  getCheckoutSessionFactory,
  getWorkspaceCheckoutSessionFactory,
  getWorkspacePlanFactory,
  saveCheckoutSessionFactory,
  upsertWorkspaceSubscriptionFactory,
  updateCheckoutSessionStatusFactory,
  upsertPaidWorkspacePlanFactory,
  getWorkspaceSubscriptionFactory,
  getWorkspaceSubscriptionBySubscriptionIdFactory,
  getWorkspaceSubscriptionsPastBillingCycleEndFactory
} from '@/modules/gatekeeper/repositories/billing'
import {
  createTestSubscriptionData,
  createTestWorkspaceSubscription
} from '@/modules/gatekeeper/tests/helpers'
import { upsertWorkspaceFactory } from '@/modules/workspaces/repositories/workspaces'
import { truncateTables } from '@/test/hooks'
import { createAndStoreTestWorkspaceFactory } from '@/test/speckle-helpers/workspaces'
import { expect } from 'chai'
import cryptoRandomString from 'crypto-random-string'

const upsertWorkspace = upsertWorkspaceFactory({ db })
const createAndStoreTestWorkspace = createAndStoreTestWorkspaceFactory({
  upsertWorkspace
})
const getWorkspacePlan = getWorkspacePlanFactory({ db })
const upsertPaidWorkspacePlan = upsertPaidWorkspacePlanFactory({ db })
const saveCheckoutSession = saveCheckoutSessionFactory({ db })
const deleteCheckoutSession = deleteCheckoutSessionFactory({ db })
const getCheckoutSession = getCheckoutSessionFactory({ db })
const getWorkspaceCheckoutSession = getWorkspaceCheckoutSessionFactory({ db })
const updateCheckoutSessionStatus = updateCheckoutSessionStatusFactory({ db })
const upsertWorkspaceSubscription = upsertWorkspaceSubscriptionFactory({ db })
const getWorkspaceSubscription = getWorkspaceSubscriptionFactory({ db })
const getWorkspaceSubscriptionBySubscriptionId =
  getWorkspaceSubscriptionBySubscriptionIdFactory({ db })

const getSubscriptionsAboutToEndBillingCycle =
  getWorkspaceSubscriptionsPastBillingCycleEndFactory({ db })

describe('billing repositories @gatekeeper', () => {
  describe('workspacePlans', () => {
    describe('upsertPaidWorkspacePlanFactory creates a function, that', () => {
      it('creates a workspacePlan if it does not exist', async () => {
        const workspace = await createAndStoreTestWorkspace()
        const workspaceId = workspace.id
        let storedWorkspacePlan = await getWorkspacePlan({ workspaceId })
        expect(storedWorkspacePlan).to.be.null
        const workspacePlan = {
          name: 'business',
          status: 'paymentFailed',
          workspaceId
        } as const
        await upsertPaidWorkspacePlan({
          workspacePlan
        })

        storedWorkspacePlan = await getWorkspacePlan({ workspaceId })
        expect(storedWorkspacePlan).deep.equal(workspacePlan)
      })
      it('updates a workspacePlan name and status if a plan exists', async () => {
        const workspace = await createAndStoreTestWorkspace()
        const workspaceId = workspace.id
        const workspacePlan = {
          name: 'business',
          status: 'paymentFailed',
          workspaceId
        } as const
        await upsertPaidWorkspacePlan({
          workspacePlan
        })

        let storedWorkspacePlan = await getWorkspacePlan({ workspaceId })
        expect(storedWorkspacePlan).deep.equal(workspacePlan)

        const planUpdate = { ...workspacePlan, status: 'valid' } as const
        await upsertPaidWorkspacePlan({ workspacePlan: planUpdate })

        storedWorkspacePlan = await getWorkspacePlan({ workspaceId })
        expect(storedWorkspacePlan).deep.equal(planUpdate)
      })
    })
  })
  describe('checkoutSessions', () => {
    describe('saveCheckoutSessionFactory creates a function that,', () => {
      it('stores a checkout session', async () => {
        const workspace = await createAndStoreTestWorkspace()
        const workspaceId = workspace.id
        let storedSession = await getWorkspaceCheckoutSession({ workspaceId })
        expect(storedSession).to.be.null
        const checkoutSession = {
          id: cryptoRandomString({ length: 10 }),
          billingInterval: 'monthly',
          createdAt: new Date(),
          paymentStatus: 'unpaid',
          updatedAt: new Date(),
          url: 'https://example.com',
          workspaceId,
          workspacePlan: 'business'
        } as const

        await saveCheckoutSession({
          checkoutSession
        })

        storedSession = await getCheckoutSession({ sessionId: checkoutSession.id })
        expect(storedSession).deep.equal(checkoutSession)
      })
    })
    describe('deleteCheckoutSessionFactory creates a function, that', () => {
      it('deletes a checkout session', async () => {
        const workspace = await createAndStoreTestWorkspace()
        const workspaceId = workspace.id
        const checkoutSession = {
          id: cryptoRandomString({ length: 10 }),
          billingInterval: 'monthly',
          createdAt: new Date(),
          paymentStatus: 'unpaid',
          updatedAt: new Date(),
          url: 'https://example.com',
          workspaceId,
          workspacePlan: 'business'
        } as const

        await saveCheckoutSession({
          checkoutSession
        })

        let storedSession = await getCheckoutSession({ sessionId: checkoutSession.id })
        expect(storedSession).deep.equal(checkoutSession)
        await deleteCheckoutSession({ checkoutSessionId: checkoutSession.id })

        storedSession = await getCheckoutSession({ sessionId: checkoutSession.id })
        expect(storedSession).to.be.null
      })
      it('does not fail if the checkout session is not found', async () => {
        await deleteCheckoutSession({
          checkoutSessionId: cryptoRandomString({ length: 10 })
        })
      })
    })
    describe('updateCheckoutSessionFactory creates a function, that', () => {
      it('updates the session paymentStatus and updatedAt', async () => {
        const workspace = await createAndStoreTestWorkspace()
        const workspaceId = workspace.id
        const checkoutSession = {
          id: cryptoRandomString({ length: 10 }),
          billingInterval: 'monthly',
          createdAt: new Date(),
          paymentStatus: 'unpaid',
          updatedAt: new Date(),
          url: 'https://example.com',
          workspaceId,
          workspacePlan: 'business'
        } as const

        await saveCheckoutSession({
          checkoutSession
        })

        let storedSession = await getCheckoutSession({
          sessionId: checkoutSession.id
        })
        expect(storedSession).deep.equal(checkoutSession)

        await updateCheckoutSessionStatus({
          sessionId: checkoutSession.id,
          paymentStatus: 'paid'
        })

        storedSession = await getCheckoutSession({
          sessionId: checkoutSession.id
        })
        expect(storedSession?.paymentStatus).to.equal('paid')
      })
    })
    describe('getWorkspaceCheckoutSessionFactory creates a function, that', () => {
      it('returns null for workspaces without checkoutSessions', async () => {
        const workspace = await createAndStoreTestWorkspace()
        const workspaceId = workspace.id
        const storedSession = await getWorkspaceCheckoutSession({ workspaceId })
        expect(storedSession).to.be.null
      })
      it('gets the checkout session for the workspace', async () => {
        const workspace = await createAndStoreTestWorkspace()
        const workspaceId = workspace.id
        const checkoutSession = {
          id: cryptoRandomString({ length: 10 }),
          billingInterval: 'monthly',
          createdAt: new Date(),
          paymentStatus: 'unpaid',
          updatedAt: new Date(),
          url: 'https://example.com',
          workspaceId,
          workspacePlan: 'business'
        } as const

        await saveCheckoutSession({
          checkoutSession
        })

        const storedSession = await getWorkspaceCheckoutSession({ workspaceId })
        expect(storedSession).deep.equal(checkoutSession)
      })
    })
  })
  describe('workspaceSubscriptions', () => {
    describe('upsertWorkspaceSubscription creates a function, that', () => {
      it('saves and updates the subscription', async () => {
        const workspace = await createAndStoreTestWorkspace()
        const workspaceId = workspace.id
        const subscriptionData = createTestSubscriptionData({
          products: [
            {
              priceId: cryptoRandomString({ length: 10 }),
              quantity: 10,
              productId: cryptoRandomString({ length: 10 }),
              subscriptionItemId: cryptoRandomString({ length: 10 })
            }
          ]
        })
        const workspaceSubscription = createTestWorkspaceSubscription({
          workspaceId,
          billingInterval: 'monthly',
          subscriptionData
        })
        await upsertWorkspaceSubscription({ workspaceSubscription })
        let storedSubscription = await getWorkspaceSubscription({ workspaceId })
        expect(storedSubscription).deep.equal(workspaceSubscription)
        workspaceSubscription.billingInterval = 'yearly'
        workspaceSubscription.subscriptionData.products[0].quantity = 3

        await upsertWorkspaceSubscription({ workspaceSubscription })
        storedSubscription = await getWorkspaceSubscription({ workspaceId })
        expect(storedSubscription).deep.equal(workspaceSubscription)
      })
    })
    describe('getWorkspaceSubscriptionFactory creates a function, that', () => {
      it('returns null if the subscription is not found', async () => {
        const sub = await getWorkspaceSubscription({
          workspaceId: cryptoRandomString({ length: 10 })
        })
        expect(sub).to.be.null
      })
    })

    describe('getWorkspaceSubscriptionBySubscriptionIdFactory creates a function, that', () => {
      it('returns null if the subscription is not found', async () => {
        const sub = await getWorkspaceSubscriptionBySubscriptionId({
          subscriptionId: cryptoRandomString({ length: 10 })
        })
        expect(sub).to.be.null
      })
      it('returns the sub', async () => {
        const workspace = await createAndStoreTestWorkspace()
        const workspaceId = workspace.id
        const workspaceSubscription = createTestWorkspaceSubscription({ workspaceId })
        await upsertWorkspaceSubscription({ workspaceSubscription })
        const storedSubscription = await getWorkspaceSubscriptionBySubscriptionId({
          subscriptionId: workspaceSubscription.subscriptionData.subscriptionId
        })
        expect(storedSubscription).deep.equal(workspaceSubscription)
      })
    })
    describe('getWorkspaceSubscriptionsPastBillingCycleEndFactory', () => {
      before(async () => {
        await truncateTables(['workspace_subscriptions'])
      })
      it('returns subs, that are about to end their billing cycle', async () => {
        const workspace1 = await createAndStoreTestWorkspace()
        const workspace1Id = workspace1.id
        const workspace1Subscription = createTestWorkspaceSubscription({
          workspaceId: workspace1Id,
          currentBillingCycleEnd: new Date(2099, 0, 1)
        })
        await upsertWorkspaceSubscription({
          workspaceSubscription: workspace1Subscription
        })

        const workspace2 = await createAndStoreTestWorkspace()
        const workspace2Id = workspace2.id
        const currentBillingCycleEnd = new Date()
        currentBillingCycleEnd.setMinutes(currentBillingCycleEnd.getMinutes() + 4)
        const workspace2Subscription = createTestWorkspaceSubscription({
          workspaceId: workspace2Id
        })
        await upsertWorkspaceSubscription({
          workspaceSubscription: workspace2Subscription
        })
        const subscriptions = await getSubscriptionsAboutToEndBillingCycle()
        expect(subscriptions).deep.equalInAnyOrder([workspace2Subscription])
      })
    })
  })
})
