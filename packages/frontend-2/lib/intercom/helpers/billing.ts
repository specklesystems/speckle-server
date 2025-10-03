import type { MaybeNullOrUndefined } from '@speckle/shared'
import { formatPrice } from '~/lib/billing/helpers/plan'
import {
  type WorkspacePaidPlanPrices,
  type WorkspacePlanPrice,
  BillingInterval
} from '~/lib/common/generated/gql/graphql'

export const estimatedMonthlySpend = (params: {
  planName: MaybeNullOrUndefined<string>
  interval: MaybeNullOrUndefined<BillingInterval>
  prices: MaybeNullOrUndefined<WorkspacePaidPlanPrices>
  seats: number
}) => {
  const { planName, interval, prices, seats } = params

  if (!planName || !interval || !prices || !seats) return null

  const planPrice = (
    prices?.[planName as keyof WorkspacePaidPlanPrices] as WorkspacePlanPrice
  )?.[interval]

  if (!planPrice) return null

  const monthlyAmount =
    interval === BillingInterval.Yearly ? planPrice.amount / 12 : planPrice.amount

  return formatPrice({
    amount: monthlyAmount * seats,
    currency: planPrice.currency
  })
}
