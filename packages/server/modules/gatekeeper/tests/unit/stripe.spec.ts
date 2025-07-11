import { buildFakeStripe } from '@/modules/gatekeeper/tests/helpers/stripe'
import cryptoRandomString from 'crypto-random-string'
import {
  buildTestSubscriptionData,
  buildTestSubscriptionProduct
} from '@/modules/gatekeeper/tests/helpers/workspacePlan'
import { reconcileWorkspaceSubscriptionFactory } from '@/modules/gatekeeper/clients/stripe'
import { expect } from 'chai'

describe('Stripe integration', () => {
  describe('Reconciliation', () => {
    it('does not send any delete or create anything in Stripe when existing subscription equals to the new one', async () => {
      const updates = {}
      const subscriptionId = cryptoRandomString({ length: 10 })
      const subscriptionItemId = cryptoRandomString({ length: 10 })
      const fakeStripe = buildFakeStripe(updates)
      const subscriptionData = buildTestSubscriptionData({
        subscriptionId,
        products: [
          buildTestSubscriptionProduct({
            subscriptionItemId,
            quantity: 2
          })
        ]
      })
      const reconcileWorkspaceSubscription = reconcileWorkspaceSubscriptionFactory({
        getStripeClient: () => fakeStripe,
        getStripeSubscriptionData: async () => subscriptionData
      })

      await reconcileWorkspaceSubscription({
        subscriptionData,
        prorationBehavior: 'none'
      })

      expect(updates).to.be.deep.equal({
        [subscriptionId]: {
          items: [{ quantity: 2, id: subscriptionItemId }],
          // eslint-disable-next-line camelcase
          proration_behavior: 'none'
        }
      })
    })

    it('deletes the current products and adds only the needed when stripe has more products than we provided', async () => {
      const updates = {}
      const subscriptionId = cryptoRandomString({ length: 10 })
      const priceId = cryptoRandomString({ length: 10 })
      const subscriptionItemId = cryptoRandomString({ length: 10 })
      const fakeStripe = buildFakeStripe(updates)
      const subscriptionData = buildTestSubscriptionData({
        subscriptionId,
        products: [
          buildTestSubscriptionProduct({
            priceId,
            subscriptionItemId,
            quantity: 1
          })
        ]
      })
      const reconcileWorkspaceSubscription = reconcileWorkspaceSubscriptionFactory({
        getStripeClient: () => fakeStripe,
        getStripeSubscriptionData: async () =>
          buildTestSubscriptionData({
            subscriptionId,
            products: [
              buildTestSubscriptionProduct({
                priceId,
                subscriptionItemId,
                quantity: 2
              })
            ]
          })
      })

      await reconcileWorkspaceSubscription({
        subscriptionData,
        prorationBehavior: 'none'
      })

      expect(updates).to.be.deep.equal({
        [subscriptionId]: {
          items: [
            { quantity: 1, price: priceId },
            { deleted: true, id: subscriptionItemId }
          ],
          // eslint-disable-next-line camelcase
          proration_behavior: 'none'
        }
      })
    })

    it('deletes the current products and ads new ones when stripe has less products than we provided', async () => {
      const updates = {}
      const subscriptionId = cryptoRandomString({ length: 10 })
      const priceId = cryptoRandomString({ length: 10 })
      const subscriptionItemId = cryptoRandomString({ length: 10 })
      const fakeStripe = buildFakeStripe(updates)
      const subscriptionData = buildTestSubscriptionData({
        subscriptionId,
        products: [
          buildTestSubscriptionProduct({
            priceId,
            subscriptionItemId,
            quantity: 3
          })
        ]
      })
      const reconcileWorkspaceSubscription = reconcileWorkspaceSubscriptionFactory({
        getStripeClient: () => fakeStripe,
        getStripeSubscriptionData: async () =>
          buildTestSubscriptionData({
            subscriptionId,
            products: [
              buildTestSubscriptionProduct({
                priceId,
                subscriptionItemId,
                quantity: 2
              })
            ]
          })
      })

      await reconcileWorkspaceSubscription({
        subscriptionData,
        prorationBehavior: 'none'
      })

      expect(updates).to.be.deep.equal({
        [subscriptionId]: {
          items: [
            { quantity: 3, price: priceId },
            { deleted: true, id: subscriptionItemId }
          ],
          // eslint-disable-next-line camelcase
          proration_behavior: 'none'
        }
      })
    })
  })
})
