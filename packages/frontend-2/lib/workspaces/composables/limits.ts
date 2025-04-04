import { graphql } from '~/lib/common/generated/gql/gql'
import { useQuery } from '@vue/apollo-composable'
import { workspacePlanLimitsQuery } from '~/lib/workspaces/graphql/queries'
import { WorkspacePlanConfigs } from '@speckle/shared'

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
      usage {
        projectCount
        modelCount
      }
    }
  }
`)

export type LimitType = 'project' | 'model' | null

export const useWorkspaceLimits = (slug: string) => {
  const { result } = useQuery(
    workspacePlanLimitsQuery,
    () => ({
      slug
    }),
    () => ({
      enabled: !!slug
    })
  )

  // Usage data
  const projectCount = computed(
    () => result.value?.workspaceBySlug?.plan?.usage.projectCount ?? 0
  )
  const modelCount = computed(
    () => result.value?.workspaceBySlug?.plan?.usage.modelCount ?? 0
  )

  // Plan limits
  const limits = computed(() => {
    const planName = result.value?.workspaceBySlug?.plan?.name
    if (!planName) return { projectCount: null, modelCount: null }

    const planConfig = WorkspacePlanConfigs[planName]
    return planConfig?.limits ?? { projectCount: null, modelCount: null }
  })

  // Limit checking
  const getLimitInfo = (limit: number | null, current: number) => {
    if (limit === null) return { remaining: null, canAdd: true }
    const remaining = Math.max(0, limit - current)
    return {
      remaining,
      canAdd: remaining > 0
    }
  }

  const projectLimitInfo = computed(() =>
    getLimitInfo(limits.value.projectCount, projectCount.value)
  )
  const modelLimitInfo = computed(() =>
    getLimitInfo(limits.value.modelCount, modelCount.value)
  )

  // Check which limit has been hit
  const getHitLimit = (): LimitType => {
    if (!projectLimitInfo.value.canAdd) return 'project'
    if (!modelLimitInfo.value.canAdd) return 'model'
    return null
  }

  // Get the value of the limit that was hit
  const getHitLimitValue = (): number => {
    const hitLimit = getHitLimit()
    if (hitLimit === 'project') return limits.value.projectCount ?? 0
    if (hitLimit === 'model') return limits.value.modelCount ?? 0
    return 0
  }

  return {
    projectCount,
    modelCount,
    limits,
    projectLimitInfo,
    modelLimitInfo,
    getHitLimit,
    getHitLimitValue
  }
}
