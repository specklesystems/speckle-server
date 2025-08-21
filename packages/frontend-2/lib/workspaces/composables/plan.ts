import { graphql } from '~~/lib/common/generated/gql'
import { workspacePlanQuery } from '~~/lib/workspaces/graphql/queries'
import { useQuery } from '@vue/apollo-composable'
import {
  PaidWorkspacePlans,
  UnpaidWorkspacePlans,
  WorkspacePlanBillingIntervals,
  isPaidPlan as isPaidPlanShared,
  isSelfServeAvailablePlan,
  doesPlanIncludeUnlimitedProjectsAddon
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
    slug
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
    subscription {
      billingInterval
      currentBillingCycleEnd
      currency
    }
  }
`)

export const useWorkspacePlan = (slug: MaybeRef<string>) => {
  const isBillingIntegrationEnabled = useIsBillingIntegrationEnabled()
  const { prices } = useActiveWorkspacePlanPrices()

  const { result } = useQuery(
    workspacePlanQuery,
    () => ({
      slug: unref(slug)
    }),
    () => ({
      enabled: isBillingIntegrationEnabled.value && !!unref(slug).length
    })
  )

  const subscription = computed(() => result.value?.workspaceBySlug?.subscription)
  const plan = computed(() => result.value?.workspaceBySlug?.plan)
  const currency = computed(() => subscription.value?.currency || 'usd')

  const isFreePlan = computed(() => plan.value?.name === UnpaidWorkspacePlans.Free)
  const isBusinessPlan = computed(
    () =>
      plan.value?.name === PaidWorkspacePlans.Pro ||
      plan.value?.name === PaidWorkspacePlans.ProUnlimited
  )
  const isUnlimitedPlan = computed(
    () => plan.value?.name === UnpaidWorkspacePlans.Unlimited
  )
  const isPaidPlan = computed(
    () => plan.value?.name && isPaidPlanShared(plan.value?.name)
  )
  const isSelfServePlan = computed(() => {
    if (!plan.value?.name) return false
    return isSelfServeAvailablePlan(plan.value.name)
  })
  const hasUnlimitedAddon = computed(() => {
    if (!plan.value?.name) return false
    return doesPlanIncludeUnlimitedProjectsAddon(plan.value.name)
  })

  // Plan status information
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
  const seats = computed(() => result.value?.workspaceBySlug?.seats)
  const hasAvailableEditorSeats = computed(() => {
    if (seats.value?.editors.available) {
      return seats.value.editors.available > 0
    }
    return false
  })
  const editorSeatPriceFormatted = computed(() => {
    if (plan.value?.name && isPaidPlanShared(plan.value?.name)) {
      return formatPrice(
        prices.value?.[plan.value?.name as PaidWorkspacePlans]?.[
          intervalIsYearly.value
            ? WorkspacePlanBillingIntervals.Yearly
            : WorkspacePlanBillingIntervals.Monthly
        ]
      )
    }

    return formatPrice({
      amount: 0,
      currency: currency.value
    })
  })

  const editorSeatPriceWithIntervalFormatted = computed(() => {
    const price = editorSeatPriceFormatted.value
    return `${price}/${intervalIsYearly.value ? 'year' : 'month'}`
  })

  return {
    plan,
    statusIsCanceled,
    isFreePlan,
    billingInterval,
    intervalIsYearly,
    currentBillingCycleEnd,
    statusIsCancelationScheduled,
    subscription,
    seats,
    hasAvailableEditorSeats,
    editorSeatPriceFormatted,
    editorSeatPriceWithIntervalFormatted,
    isUnlimitedPlan,
    isBusinessPlan,
    isPaidPlan,
    currency,
    hasUnlimitedAddon,
    isSelfServePlan
  }
}
