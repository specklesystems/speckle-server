import { graphql } from '~~/lib/common/generated/gql'
import { workspacePlanQuery } from '~~/lib/workspaces/graphql/queries'
import { useQuery } from '@vue/apollo-composable'
import {
  isNewWorkspacePlan,
  PaidWorkspacePlansNew,
  UnpaidWorkspacePlans
} from '@speckle/shared'
import {
  WorkspacePlanStatuses,
  BillingInterval
} from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment WorkspacesPlan_Workspace on Workspace {
    id
    plan {
      status
      createdAt
      name
      paymentMethod
    }
    subscription {
      billingInterval
    }
  }
`)

export const useWorkspacePlan = (slug: string) => {
  const isBillingIntegrationEnabled = useIsBillingIntegrationEnabled()

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

  const isNewPlan = computed(() =>
    isNewWorkspacePlan(result.value?.workspaceBySlug?.plan?.name)
  )

  const statusIsExpired = computed(
    () => plan.value?.status === WorkspacePlanStatuses.Expired
  )

  const statusIsCanceled = computed(
    () => plan.value?.status === WorkspacePlanStatuses.Canceled
  )

  const statusIsCancelationScheduled = computed(
    () => plan.value?.status === WorkspacePlanStatuses.CancelationScheduled
  )

  const isPurchasablePlan = computed(() =>
    Object.values(PaidWorkspacePlansNew).includes(
      plan.value?.name as PaidWorkspacePlansNew
    )
  )

  const isActivePlan = computed(
    () =>
      plan.value?.status === WorkspacePlanStatuses.Valid ||
      plan.value?.status === WorkspacePlanStatuses.PaymentFailed ||
      plan.value?.status === WorkspacePlanStatuses.CancelationScheduled
  )

  const isFreePlan = computed(() => plan.value?.name === UnpaidWorkspacePlans.Free)

  const billingInterval = computed(() => subscription.value?.billingInterval)

  const intervalIsYearly = computed(
    () => billingInterval.value === BillingInterval.Yearly
  )
  // TODO: Replace with value from API call, this a placeholder value
  const editorSeatPrice = 15
  const guestSeatPrice = 15

  const totalCost = computed(() => {
    return isPurchasablePlan.value
      ? intervalIsYearly.value
        ? editorSeatPrice * 12
        : editorSeatPrice
      : 0
  })

  // TODO: Replace with value from BE once ready
  const totalCostFormatted = computed(() => {
    return isPurchasablePlan.value
      ? `£${totalCost.value}`
      : isFreePlan.value
      ? 'Free'
      : 'Not applicable'
  })

  // TODO: Replace with actual values from backend once ready
  const seats = computed(() => {
    const seatLimits = {
      editor: 5,
      guest: 6
    }

    const usedSeats = {
      editor: 5,
      guest: 6
    }

    return {
      editor: {
        limit: seatLimits.editor,
        used: usedSeats.editor,
        hasSeatAvailable: seatLimits.editor > usedSeats.editor,
        seatPrice: editorSeatPrice
      },
      guest: {
        limit: seatLimits.guest,
        used: usedSeats.guest,
        hasSeatAvailable: seatLimits.guest > usedSeats.guest,
        seatPrice: guestSeatPrice
      }
    }
  })

  return {
    plan,
    isNewPlan,
    statusIsExpired,
    statusIsCanceled,
    isPurchasablePlan,
    isActivePlan,
    billingInterval,
    intervalIsYearly,
    totalCostFormatted,
    statusIsCancelationScheduled,
    subscription,
    seats
  }
}
