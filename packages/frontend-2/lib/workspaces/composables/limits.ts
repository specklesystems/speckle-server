import { graphql } from '~/lib/common/generated/gql/gql'
import { useQuery } from '@vue/apollo-composable'
import { workspaceLimitsQuery } from '~/lib/workspaces/graphql/queries'
import { WorkspacePlanConfigs } from '@speckle/shared'
import { useWorkspaceUsage } from '~/lib/workspaces/composables/usage'
import type { WorkspacePlanLimits_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'

graphql(`
  fragment WorkspacePlanLimits_Workspace on Workspace {
    id
    slug
    plan {
      name
    }
  }
`)

export const useLimitsState = () =>
  useState<WorkspacePlanLimits_WorkspaceFragment | null>('limits', () => null)

export const useWorkspaceLimits = (slug: string) => {
  const { modelCount, projectCount } = useWorkspaceUsage(slug)
  const limitsState = useLimitsState()

  const { onResult } = useQuery(
    workspaceLimitsQuery,
    () => ({
      slug
    }),
    () => ({
      enabled: !!slug && slug !== limitsState.value?.slug
    })
  )

  onResult((result) => {
    limitsState.value = result.data?.workspaceBySlug
  })

  // Plan limits
  const limits = computed(() => {
    const planName = limitsState.value?.plan?.name
    if (!planName)
      return {
        projectCount: 0,
        modelCount: 0,
        versionsHistory: null,
        commentHistory: null
      }

    const planConfig = WorkspacePlanConfigs[planName]
    return planConfig?.limits
  })

  const versionLimitFormatted = computed(() => {
    const versionsHistory = limits.value?.versionsHistory
    if (!versionsHistory) return 'Unlimited'

    const { value, unit } = versionsHistory
    return `${value} ${unit}`
  })

  const commentLimitFormatted = computed(() => {
    const commentHistory = limits.value?.commentHistory
    if (!commentHistory) return 'Unlimited'

    const { value, unit } = commentHistory
    return `${value} ${unit}`
  })

  const remainingProjectCount = computed(() =>
    limits.value.projectCount ? limits.value.projectCount - projectCount.value : 0
  )

  const remainingModelCount = computed(() =>
    limits.value.modelCount ? limits.value.modelCount - modelCount.value : 0
  )
  return {
    projectCount,
    modelCount,
    limits,
    remainingProjectCount,
    remainingModelCount,
    versionLimitFormatted,
    commentLimitFormatted
  }
}
