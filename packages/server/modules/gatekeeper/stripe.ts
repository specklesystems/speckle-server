import {
  GetWorkspacePlanPriceId,
  GetWorkspacePlanProductAndPriceIds,
  GetWorkspacePlanProductId
} from '@/modules/gatekeeper/domain/billing'
import { getStringFromEnv, getStripeApiKey } from '@/modules/shared/helpers/envHelper'
import { InvalidBillingIntervalError } from '@/modules/gatekeeper/errors/billing'
import { Stripe } from 'stripe'
import { get, has } from 'lodash'
import {
  MisconfiguredEnvironmentError,
  NotImplementedError
} from '@/modules/shared/errors'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'

const { FF_BILLING_INTEGRATION_ENABLED } = getFeatureFlags()

let stripeClient: Stripe | undefined = undefined

export const getStripeClient = () => {
  if (!stripeClient) stripeClient = new Stripe(getStripeApiKey(), { typescript: true })
  return stripeClient
}

const loadProductAndPriceIds: GetWorkspacePlanProductAndPriceIds = () => ({
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
  team: {
    productId: getStringFromEnv('WORKSPACE_TEAM_SEAT_STRIPE_PRODUCT_ID'),
    monthly: getStringFromEnv('WORKSPACE_MONTHLY_TEAM_SEAT_STRIPE_PRICE_ID'),
    yearly: getStringFromEnv('WORKSPACE_YEARLY_TEAM_SEAT_STRIPE_PRICE_ID')
  },
  teamUnlimited: {
    productId: getStringFromEnv('WORKSPACE_TEAM_UNLIMITED_SEAT_STRIPE_PRODUCT_ID'),
    monthly: getStringFromEnv('WORKSPACE_MONTHLY_TEAM_UNLIMITED_SEAT_STRIPE_PRICE_ID'),
    yearly: getStringFromEnv('WORKSPACE_YEARLY_TEAM_UNLIMITED_SEAT_STRIPE_PRICE_ID')
  },
  pro: {
    productId: getStringFromEnv('WORKSPACE_PRO_SEAT_STRIPE_PRODUCT_ID'),
    monthly: getStringFromEnv('WORKSPACE_MONTHLY_PRO_SEAT_STRIPE_PRICE_ID'),
    yearly: getStringFromEnv('WORKSPACE_YEARLY_PRO_SEAT_STRIPE_PRICE_ID')
  },
  proUnlimited: {
    productId: getStringFromEnv('WORKSPACE_PRO_UNLIMITED_SEAT_STRIPE_PRODUCT_ID'),
    monthly: getStringFromEnv('WORKSPACE_MONTHLY_PRO_UNLIMITED_SEAT_STRIPE_PRICE_ID'),
    yearly: getStringFromEnv('WORKSPACE_YEARLY_PRO_UNLIMITED_SEAT_STRIPE_PRICE_ID')
  }
})

const priceIds = FF_BILLING_INTEGRATION_ENABLED ? loadProductAndPriceIds() : null

export const getWorkspacePlanProductAndPriceIds: GetWorkspacePlanProductAndPriceIds =
  () => {
    if (!FF_BILLING_INTEGRATION_ENABLED || !priceIds)
      throw new MisconfiguredEnvironmentError(
        'Server is not billing enabled, do not ask for product and price Ids'
      )
    return priceIds
  }

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
}) => {
  const planMetadata = getWorkspacePlanProductAndPriceIds()[workspacePlan]
  if (!planMetadata) {
    throw new NotImplementedError(`Plan {workspacePlan} not supported`, {
      info: { workspacePlan }
    })
  }

  return planMetadata.productId
}
