import {
  GetWorkspacePlanPrice,
  GetWorkspacePlanProductId
} from '@/modules/gatekeeper/domain/billing'
import {
  getFeatureFlags,
  getStringFromEnv,
  getStripeApiKey
} from '@/modules/shared/helpers/envHelper'
import { WorkspacePricingProducts } from '@/modules/gatekeeperCore/domain/billing'
import { Stripe } from 'stripe'
import { WorkspacePlanBillingIntervals } from '@speckle/shared'

let stripeClient: Stripe | undefined = undefined

export const getStripeClient = () => {
  if (!stripeClient) stripeClient = new Stripe(getStripeApiKey(), { typescript: true })
  return stripeClient
}

const { FF_WORKSPACES_NEW_PLAN_ENABLED } = getFeatureFlags()

export const workspacePlanPrices = (): Record<
  WorkspacePricingProducts,
  Record<WorkspacePlanBillingIntervals, string> & { productId: string }
> => ({
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
  ...((FF_WORKSPACES_NEW_PLAN_ENABLED
    ? {
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
      }
    : {}) as Record<
    'team' | 'pro',
    Record<WorkspacePlanBillingIntervals, string> & { productId: string }
  >)
})

export const getWorkspacePlanPrice: GetWorkspacePlanPrice = ({
  workspacePlan,
  billingInterval
}) => workspacePlanPrices()[workspacePlan][billingInterval]

export const getWorkspacePlanProductId: GetWorkspacePlanProductId = ({
  workspacePlan
}) => workspacePlanPrices()[workspacePlan].productId
