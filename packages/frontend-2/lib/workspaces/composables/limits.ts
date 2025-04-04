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
    if (!planName) return { projectCount: 0, modelCount: 0 }

    const planConfig = WorkspacePlanConfigs[planName]
    return planConfig?.limits
  })

  const remainingProjectCount = computed(() =>
    limits.value.projectCount ? limits.value.projectCount - projectCount.value : 0
  )
  const remainingModelCount = computed(() =>
    limits.value.modelCount ? limits.value.modelCount - modelCount.value : 0
  )

  const canAddProject = computed(() => {
    if (limits.value.projectCount === null) return false
    return projectCount.value + 1 <= limits.value.projectCount
  })

  const canAddModels = (additionalModels?: number) => {
    if (limits.value.modelCount === null) return false
    if (!additionalModels) {
      return remainingModelCount.value > 1
    }
    return modelCount.value + additionalModels <= limits.value.modelCount
  }

  return {
    projectCount,
    modelCount,
    limits,
    remainingProjectCount,
    remainingModelCount,
    canAddProject,
    canAddModels
  }
}
