/* eslint-disable camelcase */
import { getResultUrl } from '@/modules/gatekeeper/clients/getResultUrl'
import type {
  GetRecurringPrices,
  GetStripeClient,
  GetSubscriptionData,
  ReconcileSubscriptionData
} from '@/modules/gatekeeper/domain/billing'
import { SubscriptionData } from '@/modules/gatekeeper/domain/billing'
import { LogicError, TestOnlyLogicError } from '@/modules/shared/errors'
import { getStripeApiKey, isTestEnv } from '@/modules/shared/helpers/envHelper'
import { TIME_MS } from '@speckle/shared'
import { isString } from 'lodash-es'
import { Stripe } from 'stripe'

let stripeClient: Stripe | undefined = undefined

export const getStripeClient: GetStripeClient = () => {
  if (!stripeClient) stripeClient = new Stripe(getStripeApiKey(), { typescript: true })
  return stripeClient
}

export const setStripeClient = (client: Stripe | undefined) => {
  if (!isTestEnv()) {
    throw new TestOnlyLogicError()
  }

  stripeClient = client
}

export const createCustomerPortalUrlFactory =
  ({
    getStripeClient,
    frontendOrigin
  }: {
    getStripeClient: GetStripeClient
    frontendOrigin: string
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
    const session = await getStripeClient().billingPortal.sessions.create({
      customer: customerId,
      return_url: getResultUrl({
        frontendOrigin,
        workspaceId,
        workspaceSlug
      }).toString()
    })
    return session.url
  }

export const getStripeSubscriptionDataFactory =
  ({ getStripeClient }: { getStripeClient: GetStripeClient }): GetSubscriptionData =>
  async ({ subscriptionId }) => {
    const stripeSubscription = await getStripeClient().subscriptions.retrieve(
      subscriptionId
    )
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
      ? new Date(stripeSubscription.cancel_at * TIME_MS.second)
      : null,
    currentPeriodEnd: stripeSubscription.current_period_end * TIME_MS.second, // this value arrives as a UNIX timestamp
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
  return SubscriptionData.parse(subscriptionData)
}

// this should be a reconcile subscriptions, we keep an accurate state in the DB
// on each change, we're reconciling that state to stripe
export const reconcileWorkspaceSubscriptionFactory =
  ({
    getStripeClient,
    getStripeSubscriptionData
  }: {
    getStripeClient: GetStripeClient
    getStripeSubscriptionData: GetSubscriptionData
  }): ReconcileSubscriptionData =>
  async ({ subscriptionData, prorationBehavior }) => {
    const existingSubscriptionState = await getStripeSubscriptionData({
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
    await getStripeClient().subscriptions.update(subscriptionData.subscriptionId, {
      items,
      proration_behavior: prorationBehavior
    })
  }

export const getRecurringPricesFactory =
  (deps: { getStripeClient: GetStripeClient }): GetRecurringPrices =>
  async () => {
    const results = await deps.getStripeClient().prices.list({
      type: 'recurring',
      limit: 100,
      active: true
    })
    return results.data.map((p) => ({
      id: p.id,
      currency: p.currency,
      unitAmount: p.unit_amount!,
      productId: isString(p.product) ? p.product : p.product.id
    }))
  }
