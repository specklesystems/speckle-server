import {
  GetWorkspacePlanPriceId,
  GetWorkspacePlanProductAndPriceIds,
  GetWorkspacePlanProductId
} from '@/modules/gatekeeper/domain/billing'
import { getStringFromEnv } from '@/modules/shared/helpers/envHelper'
import { NotImplementedError } from '@/modules/shared/errors'

const loadProductAndPriceIds: GetWorkspacePlanProductAndPriceIds = () => ({
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
