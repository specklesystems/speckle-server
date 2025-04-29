import {
  Currency,
  GetWorkspacePlanPriceId,
  GetWorkspacePlanProductAndPriceIds,
  GetWorkspacePlanProductId,
  isMultiCurrencyPrice
} from '@/modules/gatekeeper/domain/billing'
import { getStringFromEnv, getStripeApiKey } from '@/modules/shared/helpers/envHelper'
import { PriceLookupError } from '@/modules/gatekeeper/errors/billing'
import { Stripe } from 'stripe'
import { NotImplementedError } from '@/modules/shared/errors'

let stripeClient: Stripe | undefined = undefined

export const getStripeClient = () => {
  if (!stripeClient) stripeClient = new Stripe(getStripeApiKey(), { typescript: true })
  return stripeClient
}

const loadProductAndPriceIds: GetWorkspacePlanProductAndPriceIds = () => ({
  // old
  guest: {
    productId: getStringFromEnv('WORKSPACE_GUEST_SEAT_STRIPE_PRODUCT_ID'),
    monthly: {
      gbp: getStringFromEnv('WORKSPACE_MONTHLY_GUEST_SEAT_STRIPE_PRICE_ID')
    },
    yearly: {
      gbp: getStringFromEnv('WORKSPACE_YEARLY_GUEST_SEAT_STRIPE_PRICE_ID')
    }
  },
  starter: {
    productId: getStringFromEnv('WORKSPACE_STARTER_SEAT_STRIPE_PRODUCT_ID'),
    monthly: {
      gbp: getStringFromEnv('WORKSPACE_MONTHLY_STARTER_SEAT_STRIPE_PRICE_ID')
    },
    yearly: {
      gbp: getStringFromEnv('WORKSPACE_YEARLY_STARTER_SEAT_STRIPE_PRICE_ID')
    }
  },
  plus: {
    productId: getStringFromEnv('WORKSPACE_PLUS_SEAT_STRIPE_PRODUCT_ID'),
    monthly: {
      gbp: getStringFromEnv('WORKSPACE_MONTHLY_PLUS_SEAT_STRIPE_PRICE_ID')
    },
    yearly: {
      gbp: getStringFromEnv('WORKSPACE_YEARLY_PLUS_SEAT_STRIPE_PRICE_ID')
    }
  },
  business: {
    productId: getStringFromEnv('WORKSPACE_BUSINESS_SEAT_STRIPE_PRODUCT_ID'),
    monthly: {
      gbp: getStringFromEnv('WORKSPACE_MONTHLY_BUSINESS_SEAT_STRIPE_PRICE_ID')
    },
    yearly: {
      gbp: getStringFromEnv('WORKSPACE_YEARLY_BUSINESS_SEAT_STRIPE_PRICE_ID')
    }
  },
  team: {
    productId: getStringFromEnv('WORKSPACE_TEAM_SEAT_STRIPE_PRODUCT_ID'),
    monthly: {
      gbp: getStringFromEnv('WORKSPACE_MONTHLY_TEAM_SEAT_GBP_STRIPE_PRICE_ID'),
      usd: getStringFromEnv('WORKSPACE_MONTHLY_TEAM_SEAT_USD_STRIPE_PRICE_ID')
    },
    yearly: {
      gbp: getStringFromEnv('WORKSPACE_YEARLY_TEAM_SEAT_GBP_STRIPE_PRICE_ID'),
      usd: getStringFromEnv('WORKSPACE_YEARLY_TEAM_SEAT_USD_STRIPE_PRICE_ID')
    }
  },
  teamUnlimited: {
    productId: getStringFromEnv('WORKSPACE_TEAM_UNLIMITED_SEAT_STRIPE_PRODUCT_ID'),
    monthly: {
      gbp: getStringFromEnv(
        'WORKSPACE_MONTHLY_TEAM_UNLIMITED_SEAT_GBP_STRIPE_PRICE_ID'
      ),
      usd: getStringFromEnv('WORKSPACE_MONTHLY_TEAM_UNLIMITED_SEAT_USD_STRIPE_PRICE_ID')
    },
    yearly: {
      gbp: getStringFromEnv('WORKSPACE_YEARLY_TEAM_UNLIMITED_SEAT_GBP_STRIPE_PRICE_ID'),
      usd: getStringFromEnv('WORKSPACE_YEARLY_TEAM_UNLIMITED_SEAT_USD_STRIPE_PRICE_ID')
    }
  },
  pro: {
    productId: getStringFromEnv('WORKSPACE_PRO_SEAT_STRIPE_PRODUCT_ID'),
    monthly: {
      gbp: getStringFromEnv('WORKSPACE_MONTHLY_PRO_SEAT_GBP_STRIPE_PRICE_ID'),
      usd: getStringFromEnv('WORKSPACE_MONTHLY_PRO_SEAT_USD_STRIPE_PRICE_ID')
    },
    yearly: {
      gbp: getStringFromEnv('WORKSPACE_YEARLY_PRO_SEAT_GBP_STRIPE_PRICE_ID'),
      usd: getStringFromEnv('WORKSPACE_YEARLY_PRO_SEAT_USD_STRIPE_PRICE_ID')
    }
  },
  proUnlimited: {
    productId: getStringFromEnv('WORKSPACE_PRO_UNLIMITED_SEAT_STRIPE_PRODUCT_ID'),
    monthly: {
      gbp: getStringFromEnv('WORKSPACE_MONTHLY_PRO_UNLIMITED_SEAT_GBP_STRIPE_PRICE_ID'),
      usd: getStringFromEnv('WORKSPACE_MONTHLY_PRO_UNLIMITED_SEAT_USD_STRIPE_PRICE_ID')
    },
    yearly: {
      gbp: getStringFromEnv('WORKSPACE_YEARLY_PRO_UNLIMITED_SEAT_GBP_STRIPE_PRICE_ID'),
      usd: getStringFromEnv('WORKSPACE_YEARLY_PRO_UNLIMITED_SEAT_USD_STRIPE_PRICE_ID')
    }
  }
})

let priceIds: ReturnType<typeof getWorkspacePlanProductAndPriceIds> | null = null

export const getWorkspacePlanProductAndPriceIds: GetWorkspacePlanProductAndPriceIds =
  () => {
    if (!priceIds) priceIds = loadProductAndPriceIds()
    return priceIds
  }

export const getWorkspacePlanPriceId: GetWorkspacePlanPriceId = ({
  workspacePlan,
  billingInterval,
  currency
}) => {
  const plan = getWorkspacePlanProductAndPriceIds()[workspacePlan]
  const priceIds = plan[billingInterval]
  if (!isMultiCurrencyPrice(priceIds)) {
    if (currency !== Currency.gbp)
      throw new PriceLookupError(
        `Plan '${workspacePlan}' does not have a ${billingInterval} price for currency ${currency}`
      )
    return priceIds[currency]
  }
  return priceIds[currency]
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
