import { graphql } from '~~/lib/common/generated/gql'
import { workspacePlanQuery } from '~~/lib/workspaces/graphql/queries'
import { useQuery } from '@vue/apollo-composable'
import {
  isNewWorkspacePlan,
  PaidWorkspacePlansNew,
  UnpaidWorkspacePlans,
  WorkspacePlans,
  WorkspacePlanBillingIntervals
} from '@speckle/shared'
import {
  WorkspacePlanStatuses,
  BillingInterval
} from '~/lib/common/generated/gql/graphql'
import { useWorkspacePlanPrices } from '~/lib/billing/composables/prices'
import { formatPrice } from '~/lib/billing/helpers/plan'

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
  const { prices } = useWorkspacePlanPrices()

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

  // Plan type information
  const isNewPlan = computed(() =>
    isNewWorkspacePlan(result.value?.workspaceBySlug?.plan?.name)
  )
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
  const billingCycleEnd = computed(() => subscription.value?.currentBillingCycleEnd)

  // Seat information
  const seats = computed(() => subscription.value?.seats)
  const hasAvailableEditorSeats = computed(() =>
    seats.value?.editors.available && seats.value?.editors.available > 0 ? true : false
  )
  const editorSeatPriceFormatted = computed(() => {
    if (
      plan.value?.name === WorkspacePlans.Team ||
      plan.value?.name === WorkspacePlans.Business
    ) {
      return formatPrice(
        prices.value?.[plan.value?.name]?.[WorkspacePlanBillingIntervals.Monthly]
      )
    }

    return formatPrice({
      amount: 0,
      currencySymbol: '£'
    })
  })

  return {
    plan,
    isNewPlan,
    statusIsExpired,
    statusIsCanceled,
    isPurchasablePlan,
    isFreePlan,
    billingInterval,
    intervalIsYearly,
    billingCycleEnd,
    statusIsCancelationScheduled,
    subscription,
    seats,
    hasAvailableEditorSeats,
    editorSeatPriceFormatted,
    isUnlimitedPlan
  }
}
