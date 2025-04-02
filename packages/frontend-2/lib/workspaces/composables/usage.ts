import { useQuery } from '@vue/apollo-composable'
import { workspacePlanLimitsQuery } from '~/lib/workspaces/graphql/queries'

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
