/* eslint-disable camelcase */
import { getResultUrl } from '@/modules/gatekeeper/clients/getResultUrl'
import {
  CreateCheckoutSession,
  CreateCheckoutSessionOld,
  GetWorkspacePlanPriceId
} from '@/modules/gatekeeper/domain/billing'
import { isNewPlanType } from '@/modules/gatekeeper/helpers/plans'
import { EnvironmentResourceError, NotImplementedError } from '@/modules/shared/errors'
import { Stripe } from 'stripe'

export const createCheckoutSessionFactoryOld =
  ({
    stripe,
    frontendOrigin,
    getWorkspacePlanPrice
  }: {
    stripe: Stripe
    frontendOrigin: string
    getWorkspacePlanPrice: GetWorkspacePlanPriceId
  }): CreateCheckoutSessionOld =>
  async ({
    seatCount,
    guestCount,
    workspacePlan,
    billingInterval,
    workspaceSlug,
    workspaceId,
    isCreateFlow
  }) => {
    if (isNewPlanType(workspacePlan)) {
      // Use createCheckoutSessionFactoryNew instead
      throw new NotImplementedError()
    }

    const resultUrl = getResultUrl({ frontendOrigin, workspaceId, workspaceSlug })
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

    const cancel_url = isCreateFlow
      ? `${frontendOrigin}/workspaces/create?workspaceId=${workspaceId}&payment_status=canceled&session_id={CHECKOUT_SESSION_ID}`
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
      createdAt: new Date(),
      updatedAt: new Date(),
      paymentStatus: 'unpaid'
    }
  }

export const createCheckoutSessionFactoryNew =
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
    isCreateFlow
  }) => {
    const resultUrl = getResultUrl({ frontendOrigin, workspaceId, workspaceSlug })
    const price = getWorkspacePlanPrice({ billingInterval, workspacePlan })
    const costLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price, quantity: editorsCount }
    ]

    const cancel_url = isCreateFlow
      ? `${frontendOrigin}/workspaces/create?workspaceId=${workspaceId}&payment_status=canceled&session_id={CHECKOUT_SESSION_ID}`
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
      createdAt: new Date(),
      updatedAt: new Date(),
      paymentStatus: 'unpaid'
    }
  }
