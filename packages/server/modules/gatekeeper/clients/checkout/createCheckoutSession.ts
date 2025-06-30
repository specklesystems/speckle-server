/* eslint-disable camelcase */
import { getResultUrl } from '@/modules/gatekeeper/clients/getResultUrl'
import {
  CreateCheckoutSession,
  GetWorkspacePlanPriceId
} from '@/modules/gatekeeper/domain/billing'
import { EnvironmentResourceError } from '@/modules/shared/errors'
import { Stripe } from 'stripe'

export const createCheckoutSessionFactory =
  ({
    stripe,
    frontendOrigin,
    getWorkspacePlanPrice
  }: {
    stripe: Stripe
    frontendOrigin: string
    getWorkspacePlanPrice: GetWorkspacePlanPriceId
  }): CreateCheckoutSession =>
  async ({
    editorsCount,
    workspacePlan,
    billingInterval,
    workspaceSlug,
    workspaceId,
    userId,
    isCreateFlow,
    currency
  }) => {
    const resultUrl = getResultUrl({ frontendOrigin, workspaceId, workspaceSlug })
    const price = getWorkspacePlanPrice({ billingInterval, workspacePlan, currency })
    const costLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price, quantity: editorsCount }
    ]

    const cancel_url = isCreateFlow
      ? `${frontendOrigin}/workspaces/actions/create?workspaceId=${workspaceId}&payment_status=canceled&session_id={CHECKOUT_SESSION_ID}`
      : `${resultUrl.toString()}&payment_status=canceled&session_id={CHECKOUT_SESSION_ID}`

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',

      line_items: costLineItems,

      success_url: `${resultUrl.toString()}&payment_status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url
    })

    if (!session.url)
      throw new EnvironmentResourceError('Failed to create an active checkout session')
    return {
      id: session.id,
      url: session.url,
      billingInterval,
      workspacePlan,
      workspaceId,
      userId,
      currency,
      createdAt: new Date(),
      updatedAt: new Date(),
      paymentStatus: 'unpaid'
    }
  }
