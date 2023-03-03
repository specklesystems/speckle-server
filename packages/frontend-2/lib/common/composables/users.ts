import { useQuery } from '@vue/apollo-composable'
import { UserSearchQueryVariables } from '~~/lib/common/generated/gql/graphql'
import { userSearchQuery } from '~~/lib/common/graphql/queries'

export function useUserSearch(params: { variables: Ref<UserSearchQueryVariables> }) {
  const { variables } = params
  const { result } = useQuery(userSearchQuery, variables, () => ({
    debounce: 300,
    enabled: (variables.value.query || '').length >= 3
  }))

  return {
    userSearch: result
  }
}
