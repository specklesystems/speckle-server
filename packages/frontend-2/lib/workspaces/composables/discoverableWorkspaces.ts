import { useQuery } from '@vue/apollo-composable'
import { discoverableWorkspacesQuery } from '../graphql/queries'
import { graphql } from '~/lib/common/generated/gql'

graphql(`
  fragment DiscoverableList_Workspaces on User {
    discoverableWorkspaces {
      id
      name
      logo
      description
      slug
    }
  }
`)

export const useDiscoverableWorkspaces = () => {
  const { result, loading, error } = useQuery(discoverableWorkspacesQuery)

  const discoverableWorkspaces = computed(
    () => result.value?.activeUser?.discoverableWorkspaces || []
  )

  const hasDiscoverableWorkspaces = computed(
    () => discoverableWorkspaces.value.length > 0
  )

  return {
    discoverableWorkspaces,
    hasDiscoverableWorkspaces,
    loading,
    error
  }
}
