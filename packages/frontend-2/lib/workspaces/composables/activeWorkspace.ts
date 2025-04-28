import { graphql } from '~/lib/common/generated/gql/gql'
import { useQuery } from '@vue/apollo-composable'
import { activeWorkspaceQuery } from '~/lib/workspaces/graphql/queries'
import { Roles } from '@speckle/shared'

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
  const isAdmin = computed(() => activeWorkspace.value?.role === Roles.Workspace.Admin)

  return {
    activeWorkspace,
    isAdmin
  }
}
