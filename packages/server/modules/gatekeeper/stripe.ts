import {
  GetWorkspacePlanPriceId,
  GetWorkspacePlanProductAndPriceIds,
  GetWorkspacePlanProductId
} from '@/modules/gatekeeper/domain/billing'
import { getStringFromEnv, getStripeApiKey } from '@/modules/shared/helpers/envHelper'
import { InvalidBillingIntervalError } from '@/modules/gatekeeper/errors/billing'
import { Stripe } from 'stripe'
import { get, has } from 'lodash'

let stripeClient: Stripe | undefined = undefined

export const getStripeClient = () => {
  if (!stripeClient) stripeClient = new Stripe(getStripeApiKey(), { typescript: true })
  return stripeClient
}

export const getWorkspacePlanProductAndPriceIds: GetWorkspacePlanProductAndPriceIds =
  () => ({
    // old
    guest: {
      productId: getStringFromEnv('WORKSPACE_GUEST_SEAT_STRIPE_PRODUCT_ID'),
      monthly: getStringFromEnv('WORKSPACE_MONTHLY_GUEST_SEAT_STRIPE_PRICE_ID'),
      yearly: getStringFromEnv('WORKSPACE_YEARLY_GUEST_SEAT_STRIPE_PRICE_ID')
    },
    starter: {
      productId: getStringFromEnv('WORKSPACE_STARTER_SEAT_STRIPE_PRODUCT_ID'),
      monthly: getStringFromEnv('WORKSPACE_MONTHLY_STARTER_SEAT_STRIPE_PRICE_ID'),
      yearly: getStringFromEnv('WORKSPACE_YEARLY_STARTER_SEAT_STRIPE_PRICE_ID')
    },
    plus: {
      productId: getStringFromEnv('WORKSPACE_PLUS_SEAT_STRIPE_PRODUCT_ID'),
      monthly: getStringFromEnv('WORKSPACE_MONTHLY_PLUS_SEAT_STRIPE_PRICE_ID'),
      yearly: getStringFromEnv('WORKSPACE_YEARLY_PLUS_SEAT_STRIPE_PRICE_ID')
    },
    business: {
      productId: getStringFromEnv('WORKSPACE_BUSINESS_SEAT_STRIPE_PRODUCT_ID'),
      monthly: getStringFromEnv('WORKSPACE_MONTHLY_BUSINESS_SEAT_STRIPE_PRICE_ID'),
      yearly: getStringFromEnv('WORKSPACE_YEARLY_BUSINESS_SEAT_STRIPE_PRICE_ID')
    },
    // new
    team: {
      productId: getStringFromEnv('WORKSPACE_TEAM_SEAT_STRIPE_PRODUCT_ID'),
      monthly: getStringFromEnv('WORKSPACE_MONTHLY_TEAM_SEAT_STRIPE_PRICE_ID'),
      yearly: getStringFromEnv('WORKSPACE_YEARLY_TEAM_SEAT_STRIPE_PRICE_ID')
    },
    pro: {
      productId: getStringFromEnv('WORKSPACE_PRO_SEAT_STRIPE_PRODUCT_ID'),
      monthly: getStringFromEnv('WORKSPACE_MONTHLY_PRO_SEAT_STRIPE_PRICE_ID'),
      yearly: getStringFromEnv('WORKSPACE_YEARLY_PRO_SEAT_STRIPE_PRICE_ID')
    }
  })

export const getWorkspacePlanPriceId: GetWorkspacePlanPriceId = ({
  workspacePlan,
  billingInterval
}) => {
  const plan = getWorkspacePlanProductAndPriceIds()[workspacePlan]
  if (!has(plan, billingInterval)) {
    throw new InvalidBillingIntervalError(
      `Plan '${plan}' does not have a billing interval '${billingInterval}'`
    )
  }

  return get(plan, billingInterval) as string
}

export const getWorkspacePlanProductId: GetWorkspacePlanProductId = ({
  workspacePlan
}) => getWorkspacePlanProductAndPriceIds()[workspacePlan].productId
