import { useApolloClient, useMutation, useQuery } from '@vue/apollo-composable'
import { graphql } from '~~/lib/common/generated/gql'

export const activeUserMetaQuery = graphql(`
  query ActiveUserMeta {
    activeUser {
      meta {
        legacyProjectsExplainerCollapsed
        intelligenceCommunityStandUpBannerDismissed
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

export const updateIntelligenceCommunityStandUpBannerDismissedMutation = graphql(`
  mutation UpdateIntelligenceCommunityStandUpBannerDismissed($value: Boolean!) {
    activeUserMutations {
      meta {
        setIntelligenceCommunityStandUpBannerDismissed(value: $value)
      }
    }
  }
`)

export function useActiveUserMeta() {
  const { result } = useQuery(activeUserMetaQuery)
  const { mutate: updateLegacyProjectsExplainer } = useMutation(
    updateLegacyProjectsExplainerMutation
  )
  const { mutate: updateIntelligenceCommunityStandUpBanner } = useMutation(
    updateIntelligenceCommunityStandUpBannerDismissedMutation
  )
  const apollo = useApolloClient().client
  const cache = apollo.cache
  const { activeUser } = useActiveUser()

  const activeUserId = computed(() => activeUser.value?.id ?? '')
  const meta = computed(() => result.value?.activeUser?.meta)

  const hasCollapsedLegacyProjectsExplainer = computed(
    () => meta.value?.legacyProjectsExplainerCollapsed
  )

  const hasDismissedIntelligenceCommunityStandUpBanner = computed(
    () => meta.value?.intelligenceCommunityStandUpBannerDismissed
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

  const updateIntelligenceCommunityStandUpBannerDismissed = async (value: boolean) => {
    await updateIntelligenceCommunityStandUpBanner({ value })

    modifyObjectField(
      cache,
      getCacheId('User', activeUserId.value),
      'meta',
      ({ helpers: { createUpdatedValue } }) =>
        createUpdatedValue(({ update }) => {
          update('intelligenceCommunityStandUpBannerDismissed', () => value)
        })
    )
  }

  return {
    hasCollapsedLegacyProjectsExplainer,
    updateLegacyProjectsExplainerCollapsed,
    hasDismissedIntelligenceCommunityStandUpBanner,
    updateIntelligenceCommunityStandUpBannerDismissed
  }
}
