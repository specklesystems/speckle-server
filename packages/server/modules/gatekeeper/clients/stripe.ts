/* eslint-disable camelcase */
import { getResultUrl } from '@/modules/gatekeeper/clients/getResultUrl'
import {
  GetSubscriptionData,
  ReconcileSubscriptionData,
  SubscriptionData
} from '@/modules/gatekeeper/domain/billing'
import { LogicError } from '@/modules/shared/errors'
import { Stripe } from 'stripe'

export const createCustomerPortalUrlFactory =
  ({
    stripe,
    frontendOrigin
  }: // getWorkspacePlanPrice
  {
    stripe: Stripe
    frontendOrigin: string
    // getWorkspacePlanPrice: GetWorkspacePlanPrice
  }) =>
  async ({
    workspaceId,
    workspaceSlug,
    customerId
  }: {
    customerId: string
    workspaceId: string
    workspaceSlug: string
  }): Promise<string> => {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: getResultUrl({
        frontendOrigin,
        workspaceId,
        workspaceSlug
      }).toString()
    })
    return session.url
  }

export const getSubscriptionDataFactory =
  ({
    stripe
  }: // getWorkspacePlanPrice
  {
    stripe: Stripe
    // getWorkspacePlanPrice: GetWorkspacePlanPrice
  }): GetSubscriptionData =>
  async ({ subscriptionId }) => {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
    return parseSubscriptionData(stripeSubscription)
  }

export const parseSubscriptionData = (
  stripeSubscription: Stripe.Subscription
): SubscriptionData => {
  const subscriptionData = {
    customerId:
      typeof stripeSubscription.customer === 'string'
        ? stripeSubscription.customer
        : stripeSubscription.customer.id,
    subscriptionId: stripeSubscription.id,
    status: stripeSubscription.status,
    cancelAt: stripeSubscription.cancel_at
      ? new Date(stripeSubscription.cancel_at * 1000)
      : null,
    products: stripeSubscription.items.data.map((subscriptionItem) => {
      const productId =
        typeof subscriptionItem.price.product === 'string'
          ? subscriptionItem.price.product
          : subscriptionItem.price.product.id
      const quantity = subscriptionItem.quantity
      if (!quantity)
        throw new LogicError(
          'invalid subscription, we do not support products without quantities'
        )
      return {
        priceId: subscriptionItem.price.id,
        productId,
        quantity,
        subscriptionItemId: subscriptionItem.id
      }
    })
  }
  return subscriptionData
}

// this should be a reconcile subscriptions, we keep an accurate state in the DB
// on each change, we're reconciling that state to stripe
export const reconcileWorkspaceSubscriptionFactory =
  ({ stripe }: { stripe: Stripe }): ReconcileSubscriptionData =>
  async ({ subscriptionData, applyProrotation }) => {
    const existingSubscriptionState = await getSubscriptionDataFactory({ stripe })({
      subscriptionId: subscriptionData.subscriptionId
    })
    const items: Stripe.SubscriptionUpdateParams.Item[] = []
    for (const product of subscriptionData.products) {
      const existingProduct = existingSubscriptionState.products.find(
        (p) => p.productId === product.productId
      )
      // we're adding a new product to the sub
      if (!existingProduct) {
        items.push({ quantity: product.quantity, price: product.priceId })
        // we're moving a product to a new price for ie upgrading to a yearly plan
      } else if (existingProduct.priceId !== product.priceId) {
        items.push({ quantity: product.quantity, price: product.priceId })
        items.push({ id: existingProduct.subscriptionItemId, deleted: true })
      } else {
        items.push({
          quantity: product.quantity,
          id: existingProduct.subscriptionItemId
        })
      }
    }
    // remove products from the sub
    const productIds = subscriptionData.products.map((p) => p.productId)
    const removedProducts = existingSubscriptionState.products.filter(
      (p) => !productIds.includes(p.productId)
    )
    for (const removedProduct of removedProducts) {
      items.push({ id: removedProduct.subscriptionItemId, deleted: true })
    }
    // workspaceSubscription.subscriptionData.products.
    // const item = workspaceSubscription.subscriptionData.products.find(p => p.)
    await stripe.subscriptions.update(subscriptionData.subscriptionId, {
      items,
      proration_behavior: applyProrotation ? 'create_prorations' : 'none'
    })
  }
