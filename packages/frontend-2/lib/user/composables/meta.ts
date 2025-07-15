import { useApolloClient, useMutation, useQuery } from '@vue/apollo-composable'
import { graphql } from '~~/lib/common/generated/gql'

export const activeUserMetaQuery = graphql(`
  query ActiveUserMeta {
    activeUser {
      meta {
        legacyProjectsExplainerCollapsed
      }
    }
  }
`)

export const updateLegacyProjectsExplainerMutation = graphql(`
  mutation UpdateLegacyProjectsExplainer($value: Boolean!) {
    activeUserMutations {
      meta {
        setLegacyProjectsExplainerCollapsed(value: $value)
      }
    }
  }
`)

export function useActiveUserMeta() {
  const { result } = useQuery(activeUserMetaQuery)
  const { mutate: updateLegacyProjectsExplainer } = useMutation(
    updateLegacyProjectsExplainerMutation
  )
  const apollo = useApolloClient().client
  const cache = apollo.cache
  const { activeUser } = useActiveUser()

  const activeUserId = computed(() => activeUser.value?.id ?? '')
  const meta = computed(() => result.value?.activeUser?.meta)

  const hasCollapsedLegacyProjectsExplainer = computed(
    () => meta.value?.legacyProjectsExplainerCollapsed
  )

  const updateLegacyProjectsExplainerCollapsed = async (value: boolean) => {
    await updateLegacyProjectsExplainer({ value })

    modifyObjectField(
      cache,
      getCacheId('User', activeUserId.value),
      'meta',
      ({ helpers: { createUpdatedValue } }) =>
        createUpdatedValue(({ update }) => {
          update('legacyProjectsExplainerCollapsed', () => value)
        })
    )
  }

  return {
    hasCollapsedLegacyProjectsExplainer,
    updateLegacyProjectsExplainerCollapsed
  }
}
