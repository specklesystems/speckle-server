import {
  GetRecurringPrices,
  GetWorkspacePlanProductPrices,
  GetWorkspacePlanProductAndPriceIds
} from '@/modules/gatekeeper/domain/billing'
import {
  Currency,
  WorkspacePlanProductPrices
} from '@/modules/gatekeeperCore/domain/billing'
import { MisconfiguredEnvironmentError } from '@/modules/shared/errors'
import {
  redisCacheProviderFactory,
  wrapFactoryWithCache
} from '@/modules/shared/utils/caching'
import {
  PaidWorkspacePlansNew,
  TIME,
  WorkspacePlanBillingIntervals
} from '@speckle/shared'
import { set } from 'lodash'

export const getFreshWorkspacePlanProductPricesFactory =
  (deps: {
    getRecurringPrices: GetRecurringPrices
    getWorkspacePlanProductAndPriceIds: GetWorkspacePlanProductAndPriceIds
  }): GetWorkspacePlanProductPrices =>
  async () => {
    const prices = await deps.getRecurringPrices()
    const productAndPriceIds = deps.getWorkspacePlanProductAndPriceIds()

    const productPrices = Object.values(Currency).reduce((acc, currency) => {
      const currencyPrices = Object.values(PaidWorkspacePlansNew).reduce(
        (acc, paidPlan) => {
          const intervalPrices = Object.values(WorkspacePlanBillingIntervals).reduce(
            (acc, interval) => {
              const product = productAndPriceIds[paidPlan]
              const priceId = product[interval][currency]
              const price = prices.find(
                (p) =>
                  p.productId === product.productId &&
                  p.id === priceId &&
                  p.currency === currency
              )

              if (!price)
                throw new MisconfiguredEnvironmentError(
                  `${interval} price not found for ${paidPlan} plan and ${currency} currency`
                )

              set(acc, interval, { amount: price.unitAmount / 100, currency })
              return acc
            },
            {}
          )
          set(acc, paidPlan, intervalPrices)
          return acc
        },
        {}
      )
      set(acc, currency, currencyPrices)
      return acc
    }, {}) as WorkspacePlanProductPrices
    return productPrices
  }

export const getWorkspacePlanProductPricesFactory = wrapFactoryWithCache({
  factory: getFreshWorkspacePlanProductPricesFactory,
  name: `modules/gatekeeper/services/prices:getWorkspacePlanPricesFactory`,
  ttlMs: 1000 * TIME.day, // 1 day
  cacheProvider: redisCacheProviderFactory()
})
