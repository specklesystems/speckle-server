/* eslint-disable camelcase */
import {
  CreateCheckoutSession,
  GetSubscriptionData,
  WorkspaceSubscription
} from '@/modules/gatekeeper/domain/billing'
import {
  WorkspacePlanBillingIntervals,
  WorkspacePricingPlans
} from '@/modules/gatekeeper/domain/workspacePricing'
import { Stripe } from 'stripe'

type GetWorkspacePlanPrice = (args: {
  workspacePlan: WorkspacePricingPlans
  billingInterval: WorkspacePlanBillingIntervals
}) => string

export const createCheckoutSessionFactory =
  ({
    stripe,
    frontendOrigin,
    getWorkspacePlanPrice
  }: {
    stripe: Stripe
    frontendOrigin: string
    getWorkspacePlanPrice: GetWorkspacePlanPrice
  }): CreateCheckoutSession =>
  async ({
    seatCount,
    guestCount,
    workspacePlan,
    billingInterval,
    workspaceSlug,
    workspaceId
  }) => {
    //?settings=workspace/security&
    const resultUrl = new URL(
      `${frontendOrigin}/workspaces/${workspaceSlug}?workspace=${workspaceId}&settings=workspace/billing`
    )

    const price = getWorkspacePlanPrice({ billingInterval, workspacePlan })
    const costLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price, quantity: seatCount }
    ]
    if (guestCount > 0)
      costLineItems.push({
        price: getWorkspacePlanPrice({
          workspacePlan: 'guest',
          billingInterval
        }),
        quantity: guestCount
      })

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',

      line_items: costLineItems,

      success_url: `${resultUrl.toString()}&payment_status=success&session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${resultUrl.toString()}&payment_status=cancelled&session_id={CHECKOUT_SESSION_ID}`
    })

    if (!session.url) throw new Error('Failed to create an active checkout session')
    return {
      id: session.id,
      url: session.url,
      billingInterval,
      workspacePlan,
      workspaceId,
      paymentStatus: 'unpaid'
    }
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

    return {
      customerId:
        typeof stripeSubscription.customer === 'string'
          ? stripeSubscription.customer
          : stripeSubscription.customer.id,
      subscriptionId,
      products: stripeSubscription.items.data.map((subscriptionItem) => {
        const productId =
          typeof subscriptionItem.price.product === 'string'
            ? subscriptionItem.price.product
            : subscriptionItem.price.product.id
        const quantity = subscriptionItem.quantity
        if (!quantity)
          throw new Error(
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
  }

// this should be a reconcile subscriptions, we keep an accurate state in the DB
// on each change, we're reconciling that state to stripe
export const reconcileWorkspaceSubscriptionFactory =
  ({ stripe }: { stripe: Stripe }) =>
  async ({
    workspaceSubscription,
    applyProrotation
  }: {
    workspaceSubscription: WorkspaceSubscription
    applyProrotation: boolean
  }) => {
    const existingSubscriptionState = await getSubscriptionDataFactory({ stripe })({
      subscriptionId: workspaceSubscription.subscriptionData.subscriptionId
    })
    const items: Stripe.SubscriptionUpdateParams.Item[] = []
    for (const product of workspaceSubscription.subscriptionData.products) {
      const existingProduct = existingSubscriptionState.products.find(
        (p) => p.productId === product.productId
      )
      // we're adding a new product to the sub
      if (!existingProduct) {
        items.push({ quantity: product.quantity, price: product.priceId })
        // we're moving a product to a new price for ie upgrading to a yearly plan
      } else if (existingProduct.priceId !== product.priceId) {
        items.push({ quantity: product.quantity, price: product.priceId })
        items.push({ id: product.subscriptionItemId, deleted: true })
      } else {
        items.push({ quantity: product.quantity, id: product.subscriptionItemId })
      }
    }
    // workspaceSubscription.subscriptionData.products.
    // const item = workspaceSubscription.subscriptionData.products.find(p => p.)
    await stripe.subscriptions.update(
      workspaceSubscription.subscriptionData.subscriptionId,
      { items, proration_behavior: applyProrotation ? 'create_prorations' : 'none' }
    )
  }
