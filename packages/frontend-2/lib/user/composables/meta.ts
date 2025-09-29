import { useApolloClient, useMutation, useQuery } from '@vue/apollo-composable'
import { graphql } from '~~/lib/common/generated/gql'

export const activeUserMetaQuery = graphql(`
  query ActiveUserMeta {
    activeUser {
      meta {
        legacyProjectsExplainerCollapsed
        speckleCon25BannerDismissed
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

export const updateSpeckleCon25BannerDismissedMutation = graphql(`
  mutation UpdateSpeckleCon25BannerDismissed($value: Boolean!) {
    activeUserMutations {
      meta {
        setSpeckleCon25BannerDismissed(value: $value)
      }
    }
  }
`)

export function useActiveUserMeta() {
  const { result } = useQuery(activeUserMetaQuery)
  const { mutate: updateLegacyProjectsExplainer } = useMutation(
    updateLegacyProjectsExplainerMutation
  )
  const { mutate: updateSpeckleCon25Banner } = useMutation(
    updateSpeckleCon25BannerDismissedMutation
  )
  const apollo = useApolloClient().client
  const cache = apollo.cache
  const { activeUser } = useActiveUser()

  const activeUserId = computed(() => activeUser.value?.id ?? '')
  const meta = computed(() => result.value?.activeUser?.meta)

  const hasCollapsedLegacyProjectsExplainer = computed(
    () => meta.value?.legacyProjectsExplainerCollapsed
  )

  const hasDismissedSpeckleCon25Banner = computed(
    () => meta.value?.speckleCon25BannerDismissed
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

  const updateSpeckleCon25BannerDismissed = async (value: boolean) => {
    await updateSpeckleCon25Banner({ value })

    modifyObjectField(
      cache,
      getCacheId('User', activeUserId.value),
      'meta',
      ({ helpers: { createUpdatedValue } }) =>
        createUpdatedValue(({ update }) => {
          update('speckleCon25BannerDismissed', () => value)
        })
    )
  }

  return {
    hasCollapsedLegacyProjectsExplainer,
    updateLegacyProjectsExplainerCollapsed,
    hasDismissedSpeckleCon25Banner,
    updateSpeckleCon25BannerDismissed
  }
}
