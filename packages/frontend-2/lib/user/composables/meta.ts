import { useApolloClient, useMutation, useQuery } from '@vue/apollo-composable'
import { graphql } from '~~/lib/common/generated/gql'

export const activeUserMetaQuery = graphql(`
  query ActiveUserMeta {
    activeUser {
      meta {
        newWorkspaceExplainerDismissed
        legacyProjectsExplainerCollapsed
      }
    }
  }
`)

export const userMetaMutation = graphql(`
  mutation UpdateUserMeta(
    $value: Boolean!
    $setLegacyProjectsExplainerCollapsedValue2: Boolean!
  ) {
    activeUserMutations {
      meta {
        setNewWorkspaceExplainerDismissed(value: $value)
        setLegacyProjectsExplainerCollapsed(
          value: $setLegacyProjectsExplainerCollapsedValue2
        )
      }
    }
  }
`)

export function useActiveUserMeta() {
  const { result } = useQuery(activeUserMetaQuery)
  const { mutate: updateMeta } = useMutation(userMetaMutation)
  const apollo = useApolloClient().client
  const cache = apollo.cache
  const { activeUser } = useActiveUser()

  const activeUserId = computed(() => activeUser.value?.id ?? '')
  const meta = computed(() => result.value?.activeUser?.meta)

  const hasDismissedNewWorkspaceExplainer = computed(
    () => meta.value?.newWorkspaceExplainerDismissed
  )

  const hasCollapsedLegacyProjectsExplainer = computed(
    () => meta.value?.legacyProjectsExplainerCollapsed
  )

  const updateNewWorkspaceExplainerDismissed = async (value: boolean) => {
    await updateMeta({
      value,
      setLegacyProjectsExplainerCollapsedValue2:
        hasCollapsedLegacyProjectsExplainer.value ?? false
    })
    modifyObjectField(
      cache,
      getCacheId('User', activeUserId.value),
      'meta',
      ({ helpers: { createUpdatedValue } }) =>
        createUpdatedValue(({ update }) => {
          update('newWorkspaceExplainerDismissed', () => true)
        })
    )
  }
  const updateLegacyProjectsExplainerCollapsed = async (value: boolean) => {
    await updateMeta({
      value: hasDismissedNewWorkspaceExplainer.value ?? false,
      setLegacyProjectsExplainerCollapsedValue2: value
    })
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
    updateNewWorkspaceExplainerDismissed,
    updateLegacyProjectsExplainerCollapsed,
    hasDismissedNewWorkspaceExplainer,
    hasCollapsedLegacyProjectsExplainer
  }
}
