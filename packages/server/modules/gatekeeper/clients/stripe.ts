import { CreateCheckoutSession } from '@/modules/gatekeeper/domain/billing'
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
      // eslint-disable-next-line camelcase
      line_items: costLineItems,
      // eslint-disable-next-line camelcase
      success_url: `${resultUrl.toString()}&payment_status=success&session_id={CHECKOUT_SESSION_ID}`,
      // eslint-disable-next-line camelcase
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
