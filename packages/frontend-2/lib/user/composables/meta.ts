import { useApolloClient, useMutation, useQuery } from '@vue/apollo-composable'
import { graphql } from '~~/lib/common/generated/gql'

export const activeUserMetaQuery = graphql(`
  query ActiveUserMeta {
    activeUser {
      meta {
        newWorkspaceExplainerDismissed
        legacyProjectsExplainerCollapsed
        speckleConBannerDismissed
      }
    }
  }
`)

export const updateWorkspaceExplainerMutation = graphql(`
  mutation UpdateWorkspaceExplainer($value: Boolean!) {
    activeUserMutations {
      meta {
        setNewWorkspaceExplainerDismissed(value: $value)
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

export const updateSpeckleConBannerDismissedMutation = graphql(`
  mutation UpdateSpeckleConBannerDismissed($value: Boolean!) {
    activeUserMutations {
      meta {
        setSpeckleConBannerDismissed(value: $value)
      }
    }
  }
`)

export function useActiveUserMeta() {
  const { result } = useQuery(activeUserMetaQuery)
  const { mutate: updateWorkspaceExplainer } = useMutation(
    updateWorkspaceExplainerMutation
  )
  const { mutate: updateLegacyProjectsExplainer } = useMutation(
    updateLegacyProjectsExplainerMutation
  )
  const { mutate: updateSpeckleConBanner } = useMutation(
    updateSpeckleConBannerDismissedMutation
  )
  const apollo = useApolloClient().client
  const cache = apollo.cache
  const { activeUser } = useActiveUser()

  const activeUserId = computed(() => activeUser.value?.id ?? '')
  const meta = computed(() => result.value?.activeUser?.meta)

  const hasDismissedNewWorkspaceExplainer = computed(
    () => meta.value?.newWorkspaceExplainerDismissed ?? true
  )

  const hasCollapsedLegacyProjectsExplainer = computed(
    () => meta.value?.legacyProjectsExplainerCollapsed
  )

  const hasDismissedSpeckleConBanner = computed(
    () => meta.value?.speckleConBannerDismissed ?? false
  )

  const updateNewWorkspaceExplainerDismissed = async (value: boolean) => {
    await updateWorkspaceExplainer({ value })

    modifyObjectField(
      cache,
      getCacheId('User', activeUserId.value),
      'meta',
      ({ helpers: { createUpdatedValue } }) =>
        createUpdatedValue(({ update }) => {
          update('newWorkspaceExplainerDismissed', () => value)
        })
    )
  }

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

  const updateSpeckleConBannerDismissed = async (value: boolean) => {
    await updateSpeckleConBanner({ value })

    modifyObjectField(
      cache,
      getCacheId('User', activeUserId.value),
      'meta',
      ({ helpers: { createUpdatedValue } }) =>
        createUpdatedValue(({ update }) => {
          update('speckleConBannerDismissed', () => value)
        })
    )
  }

  return {
    hasDismissedNewWorkspaceExplainer,
    hasCollapsedLegacyProjectsExplainer,
    hasDismissedSpeckleConBanner,
    updateNewWorkspaceExplainerDismissed,
    updateLegacyProjectsExplainerCollapsed,
    updateSpeckleConBannerDismissed
  }
}
