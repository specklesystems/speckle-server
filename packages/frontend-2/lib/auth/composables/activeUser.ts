import { Roles } from '@speckle/shared'
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

/**
 * Get active user.
 * undefined - not yet resolved
 * null - resolved that user is a guest
 */
export function useActiveUser() {
  const { result, refetch, onResult } = useQuery(activeUserQuery)

  const activeUser = computed(() =>
    result.value ? result.value.activeUser : undefined
  )
  const isLoggedIn = computed(() => !!activeUser.value?.id)
  const distinctId = computed(() => {
    const user = activeUser.value
    if (!user) return user // null or undefined
    if (!user.email) return null

    return '@' + md5(user.email.toLowerCase()).toUpperCase()
  })

  const isGuest = computed(() => activeUser.value?.role === Roles.Server.Guest)
  const isAdmin = computed(() => activeUser.value?.role === Roles.Server.Admin)

  return { activeUser, isLoggedIn, distinctId, refetch, onResult, isGuest, isAdmin }
}

/**
 * Prevnets setup function from resolving until active user is resolved
 */
export async function useWaitForActiveUser() {
  const client = useApolloClient().client
  await client.query({ query: activeUserQuery }).catch(() => void 0)
}
