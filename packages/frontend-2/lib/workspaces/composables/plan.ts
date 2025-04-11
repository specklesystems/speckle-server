import { graphql } from '~~/lib/common/generated/gql'
import { workspacePlanQuery } from '~~/lib/workspaces/graphql/queries'
import { useQuery } from '@vue/apollo-composable'
import {
  PaidWorkspacePlansNew,
  UnpaidWorkspacePlans,
  WorkspacePlanBillingIntervals,
  isPaidPlan
} from '@speckle/shared'
import {
  WorkspacePlanStatuses,
  BillingInterval
} from '~/lib/common/generated/gql/graphql'
import { formatPrice } from '~/lib/billing/helpers/plan'
import { useActiveWorkspacePlanPrices } from '~/lib/billing/composables/prices'

graphql(`
  fragment WorkspacesPlan_Workspace on Workspace {
    id
    plan {
      status
      createdAt
      name
      paymentMethod
      usage {
        projectCount
        modelCount
      }
    }
    subscription {
      billingInterval
      currentBillingCycleEnd
      seats {
        editors {
          assigned
          available
        }
        viewers {
          assigned
          available
        }
      }
    }
  }
`)

export const useWorkspacePlan = (slug: string) => {
  const isBillingIntegrationEnabled = useIsBillingIntegrationEnabled()
  const { prices } = useActiveWorkspacePlanPrices()

  const { result } = useQuery(
    workspacePlanQuery,
    () => ({
      slug
    }),
    () => ({
      enabled: isBillingIntegrationEnabled
    })
  )

  const subscription = computed(() => result.value?.workspaceBySlug?.subscription)
  const plan = computed(() => result.value?.workspaceBySlug?.plan)

  const isFreePlan = computed(() => plan.value?.name === UnpaidWorkspacePlans.Free)
  const isUnlimitedPlan = computed(
    () => plan.value?.name === UnpaidWorkspacePlans.Unlimited
  )
  const isPurchasablePlan = computed(() =>
    Object.values(PaidWorkspacePlansNew).includes(
      plan.value?.name as PaidWorkspacePlansNew
    )
  )

  // Plan status information
  const statusIsExpired = computed(
    () => plan.value?.status === WorkspacePlanStatuses.Expired
  )
  const statusIsCanceled = computed(
    () => plan.value?.status === WorkspacePlanStatuses.Canceled
  )
  const statusIsCancelationScheduled = computed(
    () => plan.value?.status === WorkspacePlanStatuses.CancelationScheduled
  )

  // Billing cycle information
  const billingInterval = computed(() => subscription.value?.billingInterval)
  const intervalIsYearly = computed(
    () => billingInterval.value === BillingInterval.Yearly
  )
  const currentBillingCycleEnd = computed(
    () => subscription.value?.currentBillingCycleEnd
  )

  // Seat information
  const seats = computed(() => subscription.value?.seats)
  const hasAvailableEditorSeats = computed(() =>
    seats.value?.editors.available && seats.value?.editors.available > 0 ? true : false
  )
  const editorSeatPriceFormatted = computed(() => {
    if (plan.value?.name && isPaidPlan(plan.value?.name)) {
      return formatPrice(
        prices.value?.[plan.value?.name as PaidWorkspacePlansNew]?.[
          WorkspacePlanBillingIntervals.Monthly
        ]
      )
    }

    return formatPrice({
      amount: 0,
      currency: 'gbp'
    })
  })

  return {
    plan,
    statusIsExpired,
    statusIsCanceled,
    isPurchasablePlan,
    isFreePlan,
    billingInterval,
    intervalIsYearly,
    currentBillingCycleEnd,
    statusIsCancelationScheduled,
    subscription,
    seats,
    hasAvailableEditorSeats,
    editorSeatPriceFormatted,
    isUnlimitedPlan
  }
}
