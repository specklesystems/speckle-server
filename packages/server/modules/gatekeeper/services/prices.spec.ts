import { getWorkspacePlanPricesFactory } from '@/modules/gatekeeper/services/prices'
import {
  WorkspaceGuestProduct,
  WorkspacePlanProductAndPriceIds,
  WorkspacePricingProducts
} from '@/modules/gatekeeperCore/domain/billing'
import { expectToThrow } from '@/test/assertionHelper'
import { PaidWorkspacePlans } from '@speckle/shared'
import { expect } from 'chai'
import { flatten } from 'lodash'

describe('getWorkspacePlanPricesFactory', () => {
  const testProductAndPriceIds: WorkspacePlanProductAndPriceIds = {
    [WorkspaceGuestProduct]: {
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

  it('returns prices', async () => {
    const sut = getWorkspacePlanPricesFactory({
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
      WorkspaceGuestProduct
    ] as WorkspacePricingProducts[]

    for (const plan of plans) {
      expect(result[plan].productId).to.be.ok
      expect(result[plan].monthly.amount).to.be.ok
      expect(result[plan].monthly.currency).to.be.ok
      if ('yearly' in result[plan]) {
        const yearly = result[plan].yearly as { amount: number; currency: string }
        expect(yearly.amount).to.be.ok
        expect(yearly.currency).to.be.ok
      }
    }
  })

  it('throws if price not found', async () => {
    const sut = getWorkspacePlanPricesFactory({
      getWorkspacePlanProductAndPriceIds: () => testProductAndPriceIds,
      getRecurringPrices: async () => []
    })

    const e = await expectToThrow(sut)
    expect(e.message).to.match(/Price .* not found for plan .*/)
  })
})
