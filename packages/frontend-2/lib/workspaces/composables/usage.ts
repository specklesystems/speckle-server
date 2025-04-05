import { graphql } from '~/lib/common/generated/gql/gql'
import { useQuery } from '@vue/apollo-composable'
import { workspaceUsageQuery } from '~/lib/workspaces/graphql/queries'

graphql(`
  fragment WorkspaceUsage_Workspace on Workspace {
    id
    plan {
      usage {
        projectCount
        modelCount
      }
    }
  }
`)

export const useWorkspaceUsage = (slug: string) => {
  const { result } = useQuery(
    workspaceUsageQuery,
    () => ({
      slug
    }),
    () => ({
      enabled: !!slug
    })
  )

  const projectCount = computed(
    () => result.value?.workspaceBySlug?.plan?.usage.projectCount ?? 0
  )
  const modelCount = computed(
    () => result.value?.workspaceBySlug?.plan?.usage.modelCount ?? 0
  )

  return {
    projectCount,
    modelCount
  }
}
