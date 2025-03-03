import {
  GetRecurringPrices,
  GetWorkspacePlanPrices,
  GetWorkspacePlanProductAndPriceIds
} from '@/modules/gatekeeper/domain/billing'
import {
  WorkspaceGuestProduct,
  WorkspacePlanProductPrices
} from '@/modules/gatekeeperCore/domain/billing'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import {
  redisCacheProviderFactory,
  wrapFactoryWithCache
} from '@/modules/shared/utils/caching'
import { Optional, PaidWorkspacePlansNew } from '@speckle/shared'
import { set } from 'lodash'

const { FF_WORKSPACES_NEW_PLANS_ENABLED } = getFeatureFlags()

export const getFreshWorkspacePlanPricesFactory =
  (deps: {
    getRecurringPrices: GetRecurringPrices
    getWorkspacePlanProductAndPriceIds: GetWorkspacePlanProductAndPriceIds
  }): GetWorkspacePlanPrices =>
  async () => {
    const productPrices = await deps.getRecurringPrices()
    const productAndPriceIds = deps.getWorkspacePlanProductAndPriceIds()

    const ret = Object.entries(productAndPriceIds).reduce((acc, [plan, planIds]) => {
      const { productId, monthly } = planIds
      if (plan === WorkspaceGuestProduct) {
        return acc // not a real workspace plan
      }

      if (
        !FF_WORKSPACES_NEW_PLANS_ENABLED &&
        (Object.values(PaidWorkspacePlansNew) as string[]).includes(plan)
      ) {
        return acc // skipping new plans
      }

      const monthlyPrice = productPrices.find(
        (p) => p.id === monthly && p.productId === productId
      )
      if (!monthlyPrice)
        throw new MisconfiguredEnvironmentError(
          `Price ${monthly} not found for plan ${plan}`
        )
      const monthlyStruct = {
        amount: monthlyPrice.unitAmount / 100,
        currency: monthlyPrice.currency.toUpperCase()
      }

      let yearlyStruct: Optional<typeof monthlyStruct> = undefined
      if ('yearly' in planIds) {
        const { yearly } = planIds
        const yearlyPrice = productPrices.find((p) => p.id === yearly)
        if (!yearlyPrice)
          throw new MisconfiguredEnvironmentError(
            `Price ${yearly} not found for plan ${plan}`
          )
        yearlyStruct = {
          amount: yearlyPrice.unitAmount / 100,
          currency: yearlyPrice.currency.toUpperCase()
        }
      }

      const result = {
        monthly: monthlyStruct,
        productId,
        ...(yearlyStruct ? { yearly: yearlyStruct } : {})
      }

      // TS typing is tricky here cause of type differences between plans
      set(acc, plan, result)

      return acc
    }, {} as WorkspacePlanProductPrices)
    return ret
  }

export const getWorkspacePlanPricesFactory = wrapFactoryWithCache({
  factory: getFreshWorkspacePlanPricesFactory,
  name: 'modules/gatekeeper/services/prices:getWorkspacePlanPricesFactory',
  ttlMs: 1000 * 60 * 60 * 24, // 1 day
  cacheProvider: redisCacheProviderFactory()
})
