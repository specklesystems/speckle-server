import { graphql } from '~/lib/common/generated/gql/gql'
import { useQuery } from '@vue/apollo-composable'
import { activeWorkspaceQuery } from '~/lib/workspaces/graphql/queries'

graphql(`
  fragment ActiveWorkspace_Workspace on Workspace {
    id
    name
    logo
    role
    slug
  }
`)

export const useActiveWorkspace = (slug: string) => {
  const { result } = useQuery(
    activeWorkspaceQuery,
    () => ({
      slug
    }),
    () => ({
      enabled: !!slug
    })
  )

  const activeWorkspace = computed(() => result.value?.workspaceBySlug)

  return {
    activeWorkspace
  }
}
