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
    }
    subscription {
      billingInterval
      currentBillingCycleEnd
      seats {
        totalCount
        assigned
        viewersCount
      }
    }
  }
`)

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
      limit: seats.totalCount,
      used: seats.assigned,
      hasSeatAvailable: seats.totalCount > seats.assigned,
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

export const useWorkspacePlanLimits = (slug: string) => {
  const isBillingIntegrationEnabled = useIsBillingIntegrationEnabled()

  const { result } = useQuery(
    workspacePlanLimitsQuery,
    () => ({
      slug
    }),
    () => ({
      enabled: isBillingIntegrationEnabled
    })
  )

  const projectLimit = computed(() => 3)
  const modelLimit = computed(() => 8)

  const projectCount = computed(() => {
    return result.value?.workspaceBySlug?.projects?.totalCount ?? 0
  })

  const modelCount = computed(() => {
    return (
      result.value?.workspaceBySlug?.projects?.items?.reduce(
        (total, project) => total + (project?.models?.totalCount ?? 0),
        0
      ) ?? 0
    )
  })

  const remainingProjects = computed(() => {
    const count = projectCount.value ?? 0
    return Math.max(0, projectLimit.value - count)
  })

  const remainingModels = computed(() =>
    Math.max(0, modelLimit.value - modelCount.value)
  )

  const canAddProject = computed(() => remainingProjects.value > 0)

  const canAddModels = (projectModelCount: number) =>
    remainingModels.value >= projectModelCount

  const canMoveProject = (projectModelCount: number) => {
    return canAddProject.value && canAddModels(projectModelCount)
  }

  const getLimitType = (projectModelCount: number) => {
    if (!canAddProject.value) return 'project'
    if (!canAddModels(projectModelCount)) return 'model'
    return null
  }

  const getLimit = (limitType: 'project' | 'model' | null) => {
    return limitType === 'model' ? modelLimit.value : projectLimit.value
  }

  return {
    projectLimit,
    modelLimit,
    projectCount,
    modelCount,
    remainingProjects,
    remainingModels,
    canAddProject,
    canAddModels,
    canMoveProject,
    getLimitType,
    getLimit
  }
}
