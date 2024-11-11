import { WorkspacePlans, BillingInterval } from '~/lib/common/generated/gql/graphql'
import type { SeatPrices } from '~/lib/billing/helpers/types'

// TODO: get these from the backend when available
export const seatPricesConfig: SeatPrices = {
  [WorkspacePlans.Team]: {
    [BillingInterval.Monthly]: 12,
    [BillingInterval.Yearly]: 10
  },
  [WorkspacePlans.Pro]: {
    [BillingInterval.Monthly]: 40,
    [BillingInterval.Yearly]: 36
  },
  [WorkspacePlans.Business]: {
    [BillingInterval.Monthly]: 79,
    [BillingInterval.Yearly]: 63
  },
  [WorkspacePlans.Academia]: {
    [BillingInterval.Monthly]: 0,
    [BillingInterval.Yearly]: 0
  },
  [WorkspacePlans.Unlimited]: {
    [BillingInterval.Monthly]: 0,
    [BillingInterval.Yearly]: 0
  }
}
