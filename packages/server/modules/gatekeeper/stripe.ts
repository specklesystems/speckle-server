import {
  GetWorkspacePlanPrice,
  GetWorkspacePlanProductId
} from '@/modules/gatekeeper/domain/billing'
import {
  WorkspacePlanBillingIntervals,
  WorkspacePricingPlans
} from '@/modules/gatekeeper/domain/workspacePricing'
import { getStringFromEnv, getStripeApiKey } from '@/modules/shared/helpers/envHelper'
import { Stripe } from 'stripe'

let stripeClient: Stripe | undefined = undefined

export const getStripeClient = () => {
  if (!stripeClient) stripeClient = new Stripe(getStripeApiKey(), { typescript: true })
  return stripeClient
}

export const workspacePlanPrices = (): Record<
  WorkspacePricingPlans,
  Record<WorkspacePlanBillingIntervals, string> & { productId: string }
> => ({
  guest: {
    productId: getStringFromEnv('WORKSPACE_GUEST_SEAT_STRIPE_PRODUCT_ID'),
    monthly: getStringFromEnv('WORKSPACE_MONTHLY_GUEST_SEAT_STRIPE_PRICE_ID'),
    yearly: getStringFromEnv('WORKSPACE_YEARLY_GUEST_SEAT_STRIPE_PRICE_ID')
  },
  starter: {
    productId: getStringFromEnv('WORKSPACE_TEAM_SEAT_STRIPE_PRODUCT_ID'),
    monthly: getStringFromEnv('WORKSPACE_MONTHLY_TEAM_SEAT_STRIPE_PRICE_ID'),
    yearly: getStringFromEnv('WORKSPACE_YEARLY_TEAM_SEAT_STRIPE_PRICE_ID')
  },
  plus: {
    productId: getStringFromEnv('WORKSPACE_PRO_SEAT_STRIPE_PRODUCT_ID'),
    monthly: getStringFromEnv('WORKSPACE_MONTHLY_PRO_SEAT_STRIPE_PRICE_ID'),
    yearly: getStringFromEnv('WORKSPACE_YEARLY_PRO_SEAT_STRIPE_PRICE_ID')
  },
  business: {
    productId: getStringFromEnv('WORKSPACE_BUSINESS_SEAT_STRIPE_PRODUCT_ID'),
    monthly: getStringFromEnv('WORKSPACE_MONTHLY_BUSINESS_SEAT_STRIPE_PRICE_ID'),
    yearly: getStringFromEnv('WORKSPACE_YEARLY_BUSINESS_SEAT_STRIPE_PRICE_ID')
  }
})

export const getWorkspacePlanPrice: GetWorkspacePlanPrice = ({
  workspacePlan,
  billingInterval
}) => workspacePlanPrices()[workspacePlan][billingInterval]

export const getWorkspacePlanProductId: GetWorkspacePlanProductId = ({
  workspacePlan
}) => workspacePlanPrices()[workspacePlan].productId
