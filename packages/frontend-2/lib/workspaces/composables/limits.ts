import { graphql } from '~/lib/common/generated/gql/gql'
import { useQuery } from '@vue/apollo-composable'
import { workspaceLimitsQuery } from '~/lib/workspaces/graphql/queries'
import { WorkspacePlanConfigs, type MaybeNullOrUndefined } from '@speckle/shared'
import type { WorkspacePlanLimits_WorkspaceFragment } from '~/lib/common/generated/gql/graphql'
import { useFeatureFlags } from '~/lib/common/composables/env'

graphql(`
  fragment WorkspacePlanLimits_Workspace on Workspace {
    id
    slug
    plan {
      name
    }
  }
`)

export const useWorkspaceLimits = (params: {
  slug: MaybeRef<MaybeNullOrUndefined<string>>
  workspace?: MaybeRef<MaybeNullOrUndefined<WorkspacePlanLimits_WorkspaceFragment>>
}) => {
  const { slug } = params

  const featureFlags = useFeatureFlags()
  const { result } = useQuery(
    workspaceLimitsQuery,
    () => ({
      slug: unref(slug) || ''
    }),
    () => ({
      enabled: !!unref(slug)?.length
    })
  )

  const workspace = computed(
    () => unref(params.workspace) || result.value?.workspaceBySlug
  )

  // Plan limits
  const limits = computed(() => {
    const planName = workspace.value?.plan?.name
    if (!planName)
      return {
        projectCount: 0,
        modelCount: 0,
        versionsHistory: null,
        commentHistory: null
      }

    const planConfig = WorkspacePlanConfigs({ featureFlags })[planName]
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

  return {
    limits,
    versionLimitFormatted,
    commentLimitFormatted
  }
}
