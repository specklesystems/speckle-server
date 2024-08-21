import { useQuery } from '@vue/apollo-composable'
import type { Get } from 'type-fest'
import type {
  UserSearchQuery,
  UserSearchQueryVariables
} from '~~/lib/common/generated/gql/graphql'
import { userSearchQuery } from '~~/lib/common/graphql/queries'

export type UserSearchItem = NonNullable<Get<UserSearchQuery, 'userSearch.items[0]'>>

export function useUserSearch(params: { variables: Ref<UserSearchQueryVariables> }) {
  const { variables } = params
  const {
    result,
    variables: usedVariables,
    refetch,
    loading
  } = useQuery(userSearchQuery, variables, () => ({
    debounce: 300,
    enabled: (variables.value.query || '').length >= 3
  }))

  return {
    userSearch: result,
    searchVariables: usedVariables,
    refetch,
    loading
  }
}
