import {
  Roles,
  type MaybeNullOrUndefined,
  resolveMixpanelUserId
} from '@speckle/shared'
import { useApolloClient, useQuery } from '@vue/apollo-composable'
import { graphql } from '~~/lib/common/generated/gql'

export const activeUserQuery = graphql(`
  query ActiveUserMainMetadata {
    activeUser {
      id
      email
      emails {
        id
        verified
      }
      company
      bio
      name
      role
      avatar
      isOnboardingFinished
      createdAt
      verified
      notificationPreferences
      versions(limit: 0) {
        totalCount
      }
      workspaces {
        items {
          id
        }
      }
      discoverableWorkspaces {
        id
      }
      workspaceJoinRequests {
        items {
          id
        }
      }
    }
  }
`)

/**
 * Lightweight composable to read user id from cache imperatively (useful for logging)
 */
export function useReadUserId() {
  const client = useApolloClient().client
  return () => {
    return client.readQuery({ query: activeUserQuery })?.activeUser?.id
  }
}

export function useResolveUserDistinctId() {
  return (user: MaybeNullOrUndefined<{ email?: MaybeNullOrUndefined<string> }>) => {
    if (!user) return user // null or undefined
    if (!user.email) return null

    return resolveMixpanelUserId(user.email)
  }
}

/**
 * Get active user.
 * undefined - not yet resolved
 * null - resolved that user is a guest
 */
export function useActiveUser() {
  const { result, refetch, onResult } = useQuery(activeUserQuery)
  const getDistinctId = useResolveUserDistinctId()
  const isWorkspaceNewPlansEnabled = useWorkspaceNewPlansEnabled()
  const isWorkspacesEnabled = useIsWorkspacesEnabled()

  const activeUser = computed(() =>
    result.value ? result.value.activeUser : undefined
  )
  const isLoggedIn = computed(() => !!activeUser.value?.id)
  const distinctId = computed(() => {
    const user = activeUser.value
    return getDistinctId(user)
  })
  const userId = computed(() => activeUser.value?.id)

  const isGuest = computed(() => activeUser.value?.role === Roles.Server.Guest)
  const isAdmin = computed(() => activeUser.value?.role === Roles.Server.Admin)

  const projectVersionCount = computed(() => activeUser.value?.versions.totalCount)

  const requiresWorkspaceCreation = computed(() => {
    return (
      isWorkspacesEnabled.value &&
      isWorkspaceNewPlansEnabled.value &&
      activeUser.value?.workspaces?.items?.length === 0 &&
      // Legacy projects
      projectVersionCount.value === 0
    )
  })

  return {
    activeUser,
    userId,
    isLoggedIn,
    distinctId,
    refetch,
    onResult,
    isGuest,
    isAdmin,
    projectVersionCount,
    requiresWorkspaceCreation
  }
}

/**
 * Prevents setup function from resolving until active user is resolved
 */
export function useWaitForActiveUser() {
  const client = useApolloClient().client
  return async () => await client.query({ query: activeUserQuery }).catch(() => void 0)
}
