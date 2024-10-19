import db from '@/db/knex'
import {
  deleteCheckoutSessionFactory,
  getCheckoutSessionFactory,
  getWorkspaceCheckoutSessionFactory,
  getWorkspacePlanFactory,
  saveCheckoutSessionFactory,
  saveWorkspaceSubscriptionFactory,
  updateCheckoutSessionStatusFactory,
  upsertPaidWorkspacePlanFactory
} from '@/modules/gatekeeper/repositories/billing'
import { upsertWorkspaceFactory } from '@/modules/workspaces/repositories/workspaces'
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
const saveWorkspaceSubscription = saveWorkspaceSubscriptionFactory({ db })

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
        expect(
          storedSession!.updatedAt.getTime() - checkoutSession.updatedAt.getTime() > 0
        ).to.be.true
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
    describe('saveWorkspaceSubscription creates a function, that', () => {
      it('saves the subscription', async () => {
        const workspace = await createAndStoreTestWorkspace()
        const workspaceId = workspace.id
        await saveWorkspaceSubscription({
          workspaceSubscription: {
            billingInterval: 'monthly',
            createdAt: new Date(),
            updatedAt: new Date(),
            currentBillingCycleEnd: new Date(),
            subscriptionData: {
              customerId: cryptoRandomString({ length: 10 }),
              products: [],
              subscriptionId: cryptoRandomString({ length: 10 })
            },
            workspaceId
          }
        })
      })
    })
  })
})
