import {
  getFreshWorkspacePlanProductPricesFactory,
  getWorkspacePlanProductPricesFactory
} from '@/modules/gatekeeper/services/prices'
import {
  WorkspacePlanProductAndPriceIds,
  WorkspacePricingProducts
} from '@/modules/gatekeeperCore/domain/billing'
import { getFeatureFlags } from '@/modules/shared/helpers/envHelper'
import { expectToThrow } from '@/test/assertionHelper'
import { mockRedisCacheProviderFactory } from '@/test/redisHelper'
import {
  PaidWorkspacePlans,
  PaidWorkspacePlansNew,
  WorkspaceGuestSeatType
} from '@speckle/shared'
import { expect } from 'chai'
import { flatten, get } from 'lodash'

const { FF_WORKSPACES_NEW_PLANS_ENABLED } = getFeatureFlags()

const testProductAndPriceIds: WorkspacePlanProductAndPriceIds = {
  [WorkspaceGuestSeatType]: {
    productId: 'prod_guest',
    monthly: 'price_guest_monthly',
    yearly: 'price_guest_yearly'
  },
  [PaidWorkspacePlans.Starter]: {
    productId: 'prod_starter',
    monthly: 'price_starter_monthly',
    yearly: 'price_starter_yearly'
  },
  [PaidWorkspacePlans.Plus]: {
    productId: 'prod_plus',
    monthly: 'price_plus_monthly',
    yearly: 'price_plus_yearly'
  },
  [PaidWorkspacePlans.Business]: {
    productId: 'prod_business',
    monthly: 'price_business_monthly',
    yearly: 'price_business_yearly'
  },
  viewer: {
    productId: 'prod_viewer',
    monthly: 'price_viewer_monthly',
    yearly: 'price_viewer_yearly'
  },
  [PaidWorkspacePlans.Team]: {
    productId: 'prod_team',
    monthly: 'price_team_monthly'
  },
  [PaidWorkspacePlans.Pro]: {
    productId: 'prod_pro',
    monthly: 'price_pro_monthly',
    yearly: 'price_pro_yearly'
  }
}

describe('getFreshWorkspacePlanProductPricesFactory', () => {
  it('returns prices', async () => {
    const sut = getFreshWorkspacePlanProductPricesFactory({
      getWorkspacePlanProductAndPriceIds: () => testProductAndPriceIds,
      getRecurringPrices: async () => {
        // Convert testProductAndPriceIds
        const pricePairs = Object.values(testProductAndPriceIds).map((planIds) => {
          const { productId, monthly } = planIds
          return [
            {
              id: monthly,
              productId,
              unitAmount: 100,
              currency: 'usd'
            },
            ...('yearly' in planIds
              ? [
                  {
                    id: planIds.yearly,
                    productId,
                    unitAmount: 100,
                    currency: 'usd'
                  }
                ]
              : [])
          ]
        })

        return flatten(pricePairs)
      }
    })

    const result = await sut()

    expect(result).to.be.ok
    const plans = [
      ...Object.values(PaidWorkspacePlans),
      WorkspaceGuestSeatType
    ] as WorkspacePricingProducts[]

    for (const plan of plans) {
      const planResult = get(result, plan) as (typeof result)[keyof typeof result]

      if (
        !FF_WORKSPACES_NEW_PLANS_ENABLED &&
        (Object.values(PaidWorkspacePlansNew) as string[]).includes(plan)
      ) {
        if (planResult) {
          throw new Error('New plans should not appear w/ FF on')
        } else {
          continue
        }
      }

      expect(planResult).to.be.ok
      expect(planResult!.productId).to.be.ok
      expect(planResult!.monthly.amount).to.be.ok
      expect(planResult!.monthly.currency).to.eq('USD')
      expect(planResult!.monthly.currency).to.be.ok
      if ('yearly' in planResult!) {
        const yearly = planResult.yearly as { amount: number; currency: string }
        expect(yearly.amount).to.be.ok
        expect(yearly.currency).to.be.ok
      }
    }
  })

  it('throws if price not found', async () => {
    const sut = getFreshWorkspacePlanProductPricesFactory({
      getWorkspacePlanProductAndPriceIds: () => testProductAndPriceIds,
      getRecurringPrices: async () => []
    })

    const e = await expectToThrow(sut)
    expect(e.message).to.match(/Price .* not found for plan .*/)
  })

  it('throws if yearly price not found, where it should be', async () => {
    const sut = getFreshWorkspacePlanProductPricesFactory({
      getWorkspacePlanProductAndPriceIds: () => testProductAndPriceIds,
      getRecurringPrices: async () => {
        const allPriceIds = flatten(
          Object.values(testProductAndPriceIds).map((planIds) => [
            planIds.monthly,
            ...('yearly' in planIds ? [planIds.yearly] : [])
          ])
        ).filter((i) => i !== 'price_business_yearly')

        return allPriceIds.map((id) => ({
          id,
          productId: 'whatever',
          unitAmount: 100,
          currency: 'usd'
        }))
      }
    })

    const e = await expectToThrow(sut)
    expect(e.message).to.match(/Price .* not found for plan .*/)
  })
})

describe('getWorkspacePlanProductPricesFactory', () => {
  it('returns prices in a cached manner', async () => {
    let invoked = 0
    const sut = getWorkspacePlanProductPricesFactory({
      getWorkspacePlanProductAndPriceIds: () => testProductAndPriceIds,
      getRecurringPrices: async () => {
        invoked++

        // Convert testProductAndPriceIds
        const pricePairs = Object.values(testProductAndPriceIds).map((planIds) => {
          const { productId, monthly } = planIds
          return [
            {
              id: monthly,
              productId,
              unitAmount: 100,
              currency: 'usd'
            },
            ...('yearly' in planIds
              ? [
                  {
                    id: planIds.yearly,
                    productId,
                    unitAmount: 100,
                    currency: 'usd'
                  }
                ]
              : [])
          ]
        })

        return flatten(pricePairs)
      },
      // Unit test, so we want a fresh cache every time
      cacheProvider: mockRedisCacheProviderFactory({ createNewCache: true })
    })

    const result = await sut()
    expect(result).to.be.ok

    const result2 = await sut()
    expect(result2).to.be.ok
    expect(result2).to.deep.equal(result)

    expect(invoked).to.equal(1)
  })
})
