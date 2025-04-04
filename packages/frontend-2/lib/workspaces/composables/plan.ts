import { graphql } from '~~/lib/common/generated/gql'
import {
  workspacePlanLimitsQuery,
  workspacePlanQuery
} from '~~/lib/workspaces/graphql/queries'
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

  const billingCycleEnd = computed(() => subscription.value?.currentBillingCycleEnd)

  // TODO: Replace with value from API call, this a placeholder value
  const editorSeatPrice = 15

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

  const editorSeats = computed(() => {
    const seats = subscription.value?.seats
    if (!seats)
      return { limit: 0, used: 0, hasSeatAvailable: false, seatPrice: editorSeatPrice }

    return {
      limit: seats.editors.available,
      used: seats.editors.assigned,
      hasSeatAvailable: seats.editors.available > seats.editors.assigned,
      seatPrice: editorSeatPrice
    }
  })

  return {
    plan,
    isNewPlan,
    statusIsExpired,
    statusIsCanceled,
    isPurchasablePlan,
    isActivePlan,
    isFreePlan,
    billingInterval,
    intervalIsYearly,
    billingCycleEnd,
    totalCostFormatted,
    statusIsCancelationScheduled,
    subscription,
    editorSeats
  }
}

graphql(`
  fragment WorkspacePlanLimits_Workspace on Workspace {
    id
    projects(limit: 0) {
      totalCount
      items {
        id
        models(limit: 0) {
          totalCount
        }
      }
    }
    plan {
      name
    }
  }
`)

export const useGetWorkspacePlanUsage = (slug: string) => {
  const { result } = useQuery(
    workspacePlanLimitsQuery,
    () => ({
      slug
    }),
    () => ({
      enabled: !!slug
    })
  )

  const projectCount = computed(
    () => result.value?.workspaceBySlug?.projects?.totalCount ?? 0
  )
  const modelCount = computed(
    () =>
      result.value?.workspaceBySlug?.projects?.items?.reduce(
        (total, project) => total + (project?.models?.totalCount ?? 0),
        0
      ) ?? 0
  )

  return {
    projectCount,
    modelCount
  }
}

export const useWorkspacePlanLimits = (
  projectCount: ComputedRef<number>,
  modelCount: ComputedRef<number>
) => {
  const projectLimit = computed(() => 3)
  const modelLimit = computed(() => 8)

  const remainingProjects = computed(() => {
    return projectLimit.value - projectCount.value
  })

  const remainingModels = computed(() => {
    return modelLimit.value - modelCount.value
  })

  const limitType = computed(() => {
    if (projectCount.value > projectLimit.value) {
      return 'project'
    }
    if (modelCount.value > modelLimit.value) {
      return 'model'
    }
    return null
  })

  const activeLimit = computed(() => {
    const limit =
      limitType.value === 'project'
        ? projectLimit.value
        : limitType.value === 'model'
        ? modelLimit.value
        : null
    return limit
  })

  const canAddProject = computed(
    () => remainingProjects.value !== null && remainingProjects.value > 0
  )
  const canAddModels = computed(
    () => remainingModels.value !== null && remainingModels.value > 0
  )

  return {
    projectLimit,
    modelLimit,
    remainingProjects,
    remainingModels,
    canAddProject,
    canAddModels,
    limitType,
    activeLimit
  }
}
