import { graphql } from '~/lib/common/generated/gql/gql'
import { useQuery } from '@vue/apollo-composable'
import { workspaceLimitsQuery } from '~/lib/workspaces/graphql/queries'
import { WorkspacePlanConfigs } from '@speckle/shared'
import { useWorkspaceUsage } from '~/lib/workspaces/composables/usage'

graphql(`
  fragment WorkspacePlanLimits_Workspace on Workspace {
    id
    plan {
      name
    }
  }
`)

export const useWorkspaceLimits = (slug: string) => {
  const { modelCount, projectCount } = useWorkspaceUsage(slug)

  const { result } = useQuery(
    workspaceLimitsQuery,
    () => ({
      slug
    }),
    () => ({
      enabled: !!slug
    })
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
