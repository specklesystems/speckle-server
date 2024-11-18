import type {
  WorkspacePlans,
  BillingInterval
} from '~/lib/common/generated/gql/graphql'

export type SeatPrices = {
  [key in WorkspacePlans]: {
    [BillingInterval.Monthly]: number
    [BillingInterval.Yearly]: number
  }
}
