import { GetWorkspacePlanPrice } from '@/modules/gatekeeper/domain/billing'
import {
  WorkspacePlanBillingIntervals,
  WorkspacePricingPlans
} from '@/modules/gatekeeper/domain/workspacePricing'
import { getStringFromEnv, getStripeApiKey } from '@/modules/shared/helpers/envHelper'
import { Stripe } from 'stripe'

export const stripe = new Stripe(getStripeApiKey(), { typescript: true })

export const workspacePlanPrices = (): Record<
  WorkspacePricingPlans,
  Record<WorkspacePlanBillingIntervals, string> & { productId: string }
> => ({
  guest: {
    productId: getStringFromEnv('WORKSPACE_GUEST_SEAT_STRIPE_PRODUCT_ID'),
    monthly: getStringFromEnv('WORKSPACE_MONTHLY_GUEST_SEAT_STRIPE_PRICE_ID'),
    yearly: getStringFromEnv('WORKSPACE_YEARLY_GUEST_SEAT_STRIPE_PRICE_ID')
  },
  team: {
    productId: getStringFromEnv('WORKSPACE_TEAM_SEAT_STRIPE_PRODUCT_ID'),
    monthly: getStringFromEnv('WORKSPACE_MONTHLY_TEAM_SEAT_STRIPE_PRICE_ID'),
    yearly: getStringFromEnv('WORKSPACE_YEARLY_TEAM_SEAT_STRIPE_PRICE_ID')
  },
  pro: {
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
