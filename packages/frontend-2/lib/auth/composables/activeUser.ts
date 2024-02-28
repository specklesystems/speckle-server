import { Roles, type MaybeNullOrUndefined } from '@speckle/shared'
import { useApolloClient, useQuery } from '@vue/apollo-composable'
import { graphql } from '~~/lib/common/generated/gql'
import md5 from '~~/lib/common/helpers/md5'

export const activeUserQuery = graphql(`
  query ActiveUserMainMetadata {
    activeUser {
      id
      email
      company
      bio
      name
      role
      avatar
      isOnboardingFinished
      createdAt
      verified
      notificationPreferences
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

    return '@' + md5(user.email.toLowerCase()).toUpperCase()
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

  return {
    activeUser,
    userId,
    isLoggedIn,
    distinctId,
    refetch,
    onResult,
    isGuest,
    isAdmin
  }
}

/**
 * Prevents setup function from resolving until active user is resolved
 */
export function useWaitForActiveUser() {
  const client = useApolloClient().client
  return async () => await client.query({ query: activeUserQuery }).catch(() => void 0)
}
